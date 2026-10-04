# Portrait prompts

`tools/generate_portraits.py` builds every prompt from a locked template. Only the species slots change between images.

## Model

The script calls `GET /v1/models` and picks `gpt-image-2`, then `gpt-image-1.5`, then `gpt-image-1`. Override with `--model`. Every call uses `size 1024x1536` and `quality medium`.

## Style B: full-length oil portrait (the game style)

Full-body figures in minimal period clothing, so the room can judge build, height and proportions. The solemn grand-manner treatment is the joke.

```
{STYLE BLOCK}. Full-length standing figure: the whole body from the top of the head to the soles of the bare feet is inside a vertical 2:3 frame, with a small margin above the head and below the feet, figure centred. Natural, neutral standing pose, weight on both feet, arms relaxed at the sides, body turned slightly in three-quarter view, face towards the viewer. Clothing: {clothing}. Subject: an adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based on current museum reconstructions, shown as a sober museum-style figure study, not sexualised. Anatomy and body: {anatomy note}. Arms, legs, shoulders, build and body hair clearly visible. Expression: {expression}, mouth closed, dignified. Natural proportions, no makeup, no jewellery, no modern items.
```

Style block: `Grand-manner full-length oil portrait painting in the tradition of 18th-century aristocratic full-length portraits, solemn and formal, plain dark umber painted backdrop with a faint hint of distant landscape and dusky sky near the lower edge, warm directional light from the upper left, visible brushwork, aged varnish`

`{clothing}` comes before the anatomy so the garment is the first thing the model reads:

- female: `minimal period clothing; a simple hide wrap that fully covers her chest, and a hide loincloth that fully covers the groin; arms, shoulders and legs bare`
- male: `minimal period clothing; a hide loincloth that fully covers the groin; arms and legs bare`

## Style A: picture day (kept, chest-up only)

```
{STYLE BLOCK}. Chest-up portrait, three-quarter view, head fills the upper 55% of a 4:5 frame, eyes at the upper third, centred, plain backdrop. Subject: an adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based on current museum reconstructions. Anatomy: {anatomy note}. Wearing a simple, roughly stitched animal-hide wrap that fully covers the chest and shoulders, high at the neck. Expression: {expression}, mouth closed, dignified. Natural proportions, no makeup, no jewellery, no modern items.
```

Style block: `1990s school picture-day portrait photograph, mottled blue laser-swirl studio backdrop, soft frontal key light, slight film grain, photographic, natural skin texture`

The anatomy notes now end with full-body garments (loincloths, bare-chested males). Style A's own "wrap that fully covers the chest" line overrides that, but check the result.

## Shared slots

- `{anatomy note}` comes from `anatomy.female` / `anatomy.male` in `src/content/stages.json`. Each note describes the whole body, in this order: skin colour first (the model drifts darker), hair and body hair, height in metres and weight, build, limb proportions, posture, skull and face, then the garment. Keep each under about 70 words.
- `{expression}`: female "calm and patient", male "calm, mildly amused".

Calls with a reference image (the edits endpoint) wrap the template:

- Before: "The reference image shows a different individual of a different species. Use it only as the reference for art style, lighting, colour grade, backdrop, framing and rendering. Do not copy its skin colour, hair colour, body shape or clothing. Create a new portrait of a new individual:"
- After: "Match the lighting, colour grade, framing and rendering of the reference images exactly."

## Prompt rules

- Never use "smash", "sexy", "attractive", "nude", "naked", "beautiful" or any comparison to modern ethnic groups. The script refuses to send a prompt that contains them.
- Keep game wording out of prompts. Describe clothing before anatomy. If the API refuses, soften the anatomy wording, not the clothing.
- Do not name Kennis & Kennis or John Gurche, and do not use their photos as references.
- Write skin, hair and body hair from current evidence and vary them. Early African Homo and sapiens: dark skin. Neanderthals: variable, some light, red hair possible. Heavily haired early species (afarensis, Ardipithecus, Sahelanthropus): pale chimp-like skin under dense body hair.

## Review checklist (every image)

1. Whole figure from head to feet in frame, small margin, vertical 2:3.
2. Female chest covered by a garment. Groin covered for both sexes.
3. Not nude, not sexualised, no suggestive pose, no glamour. Ordinary, unretouched face and body.
4. No makeup, jewellery, piercings, tattoos or modern items.
5. Anatomy and proportions match the note: build, limb lengths, posture, body hair, brow, face projection, nose, chin.
6. Skin and hair follow the note. Across the set, older species are not darker.
7. Dignified, calm or mildly amused expression. Mouth closed. Not a caricature.
8. Same style, backdrop and light across the set.

Regenerate a failure with `--only <key> --extra "<fix>"`, at most twice per image.

## Known fixes (full-body test, gpt-image-2)

The notes alone hold for Neanderthals. For the heavily haired early species the model gives human leg length and medium-brown faces unless the run adds this `--extra` (it worked on A. afarensis; use it for `australopithecus-afarensis`, `ardipithecus-ramidus` and `sahelanthropus-tchadensis`, run with `--only`):

```
Skin check: the face, ears, hands and feet are pale pinkish-beige, clearly lighter than the reference figure's skin and much lighter than the dark body hair, like a chimpanzee's pale skin. Proportions check: arms clearly longer than a human's, fingertips hanging down to the knees; legs short relative to the long torso; cone-shaped ribcage widening to a broad belly and pelvis.
```

If a Neanderthal face reads too modern, add: `The face must read clearly as Neanderthal, not modern human: a heavy, rounded, double-arched brow ridge jutting over the eyes, a low sloping forehead, a very large wide nose on a forward-projecting midface, and a weak chin.`

Every figure fills the frame, so a 1.05 m afarensis and a 1.80 m erectus show at the same size. Height reads from the notes and on-screen text, not from the picture.

## Running

The key comes from `OPENAI_API_KEY` (falls back to the Windows user environment variable).

```bash
python tools/generate_portraits.py --full-body-test
python tools/generate_portraits.py --full-body-test --only australopithecus-afarensis-male --extra "..."
python tools/generate_portraits.py --contact-sheet
python tools/generate_portraits.py --all --style B --anchor tools/out/full-body-test/neanderthal-male.png
python tools/generate_portraits.py --all --style B --anchor tools/out/full-body-test/neanderthal-male.png --only homo-erectus-female,homo-erectus-male
python tools/generate_portraits.py --style-test --style A
```

- `--full-body-test`: Style B, Neanderthal and A. afarensis, female and male. The Neanderthal male is made first with `/v1/images/generations`, then the other three use `/v1/images/edits` with it as the reference. PNGs, `prompts.json` and a one-row `contact-sheet.png` go to `tools/out/full-body-test/`.
- `--style-test`: the older A/B comparison (8 images) into `tools/out/style-test/`. Style B there is now full length too.
- `--contact-sheet`: rebuilds both contact sheets from the PNGs on disk.
- `--all --style X --anchor PATH`: every stage in `stages.json`, female then male, through `/v1/images/edits`. The anchor is always a reference; the male also gets that stage's female for a matching pair. Raw PNGs go to `tools/out/all/`. Each is saved uncropped at 1024x1536 (2:3) as WebP (quality 85) at `public/portraits/<stage-id>-<sex>.webp`.
- `--only`: comma-separated keys (`<stage-id>-<sex>` in `--full-body-test` and `--all`, `A-neanderthal-female` in the style test).
- `--extra`: text appended to every prompt in that run, for targeted fixes.

Retries back off on 429, 5xx and network errors (5s, 10s, 20s ... up to 6 tries).
