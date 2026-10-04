# Portrait prompts

`tools/generate_portraits.py` builds every prompt from a locked template. Only the species slots change between images.

## Model

The script calls `GET /v1/models` and picks `gpt-image-2`, then `gpt-image-1.5`, then `gpt-image-1`. Override with `--model`. Every call uses `size 1024x1536` and `quality medium` (about $0.04 per image).

## Style photo: full-length studio photograph (the game style, default)

A photorealistic picture-day shoot. The joke is that it looks like a real studio portrait. Whole standing figure in minimal period clothing, so the room can judge build and proportions.

```
{STYLE BLOCK}. Full-length standing portrait: the whole body from the top of the head to the soles of the bare feet is inside a vertical 2:3 frame, with a small margin above the head and below the feet, figure centred, standing on the studio floor where the backdrop sweeps down behind the feet. Natural, relaxed neutral stance, weight on both feet, arms relaxed at the sides, body turned slightly in three-quarter view, face towards the camera. Clothing: {clothing}. Subject: an adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based on current museum reconstructions, photographed exactly like any other customer at a portrait studio, not sexualised, no glamour or fashion-model styling. Anatomy and body: {anatomy note}. {fix}Arms, legs, shoulders, build and body hair clearly visible. Expression: {expression}, mouth closed. Natural proportions, no makeup, no jewellery, no modern items.
```

Style block: `Photorealistic full-length studio portrait photograph from a professional portrait studio's picture day: a dark mottled hand-painted canvas backdrop in charcoal and deep warm brown, classic portrait-studio muslin; professional softbox key light from the front left with soft fill and a subtle rim light; neutral, colour-accurate white balance so skin tones read true; sharp focus on the subject with natural photographic depth of field, the backdrop softly out of focus; true-to-life colour, natural skin texture with pores and fine hairs, shot on a full-frame camera with an 85mm lens; a clean modern commercial studio portrait, not a field, documentary or scientific photograph`

`{fix}` is the `EXTRA` entry for that stage id (photo style only). It sits right after the anatomy note so the model weighs it. Current entries:

- `neanderthal`: a concrete face description. Thick brow visor in two arches shading deep-set eyes, hairline just above it, no upright forehead, long low skull with a bulge at the back, midface pushed forward, nose as wide as the mouth, cheeks sloping back, long upper lip, jaw with no chin, skin not deeply tanned. Without it the photo model draws a modern man with a big nose.
- `australopithecus-afarensis`, `ardipithecus-ramidus`, `sahelanthropus-tchadensis`: `EARLY_APE_FIX` (see Known fixes).

When a species keeps failing, add an `EXTRA` entry rather than relying on `--extra`.

### Sensitivity rule

Every species gets the identical modern studio setup, light and treatment. Never an ethnographic, field or anthropometric look: no sepia, no outdoor field photo, no measuring rods or height charts, no front-and-profile mugshot framing, no "specimen" staging. Height reads from the on-screen text, not the picture.

## Clothing (all full-length styles)

`{clothing}` comes before the anatomy so the garment is the first thing the model reads:

- female: `minimal period clothing; a simple hide wrap that fully covers her chest, and a wide hide wrap around the hips that fully covers the groin and buttocks and reaches mid-thigh; arms, shoulders and lower legs bare`
- male: `minimal period clothing; a wide hide wrap around the hips that fully covers the groin and buttocks and reaches mid-thigh; arms and lower legs bare`

The hip wrap replaced the old small "hide loincloth". A photoreal bare-chested male in a small loincloth was blocked once by output moderation (`moderation_blocked`, `sexual`). The mid-thigh wrap has passed every call since.

## Style B: full-length oil portrait (kept)

```
{STYLE BLOCK}. Full-length standing figure: the whole body from the top of the head to the soles of the bare feet is inside a vertical 2:3 frame, with a small margin above the head and below the feet, figure centred. Natural, neutral standing pose, weight on both feet, arms relaxed at the sides, body turned slightly in three-quarter view, face towards the viewer. Clothing: {clothing}. Subject: an adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based on current museum reconstructions, shown as a sober museum-style figure study, not sexualised. Anatomy and body: {anatomy note}. Arms, legs, shoulders, build and body hair clearly visible. Expression: {expression}, mouth closed, dignified. Natural proportions, no makeup, no jewellery, no modern items.
```

Style block: `Grand-manner full-length oil portrait painting in the tradition of 18th-century aristocratic full-length portraits, solemn and formal, plain dark umber painted backdrop with a faint hint of distant landscape and dusky sky near the lower edge, warm directional light from the upper left, visible brushwork, aged varnish`

Style B does not get the `EXTRA` fixes. Pass them with `--extra` if needed.

## Style A: picture day (kept, chest-up only)

```
{STYLE BLOCK}. Chest-up portrait, three-quarter view, head fills the upper 55% of a 4:5 frame, eyes at the upper third, centred, plain backdrop. Subject: an adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based on current museum reconstructions. Anatomy: {anatomy note}. Wearing a simple, roughly stitched animal-hide wrap that fully covers the chest and shoulders, high at the neck. Expression: {expression}, mouth closed, dignified. Natural proportions, no makeup, no jewellery, no modern items.
```

Style block: `1990s school picture-day portrait photograph, mottled blue laser-swirl studio backdrop, soft frontal key light, slight film grain, photographic, natural skin texture`

The anatomy notes end with full-body garments (loincloths, bare-chested males). Style A's own "wrap that fully covers the chest" line overrides that, but check the result.

## Shared slots

- `{anatomy note}` comes from `anatomy.female` / `anatomy.male` in `src/content/stages.json`. Each note describes the whole body, in this order: skin colour first (the model drifts darker), hair and body hair, height in metres and weight, build, limb proportions, posture, skull and face, then the garment. Keep each under about 70 words.
- `{expression}`: female "calm and patient", male "calm, mildly amused".

Calls with a reference image (the edits endpoint) wrap the template:

- Before: "The reference image shows a different individual of a different species. Use it only as the reference for photographic style, studio backdrop, lighting, colour grade, framing and rendering. Do not copy its anatomy, face, skull, body proportions, skin colour, hair or clothing. Create a new portrait of a new individual:"
- After: "Match the lighting, colour grade, framing and rendering of the reference images exactly."

## Prompt rules

- Never use "smash", "sexy", "attractive", "nude", "naked", "beautiful" or any comparison to modern ethnic groups. The script refuses to send a prompt that contains them.
- Keep game wording out of prompts. Describe clothing before anatomy. If the API refuses, soften the anatomy wording or enlarge the garment, never shrink it.
- Do not name Kennis & Kennis or John Gurche, and do not use their photos as references.
- Write skin, hair and body hair from current evidence and vary them. Early African Homo and sapiens: dark skin. Neanderthals: variable, some light, red hair possible. Heavily haired early species (afarensis, Ardipithecus, Sahelanthropus): pale chimp-like skin under dense body hair.

## Review checklist (every image)

1. Whole figure from head to feet in frame, small margin, vertical 2:3.
2. Female chest covered by a garment. Groin covered for both sexes.
3. Not nude, not sexualised, no suggestive pose, no glamour. Ordinary, unretouched face and body.
4. No makeup, jewellery, piercings, tattoos or modern items.
5. Anatomy and proportions match the note: build, limb lengths, posture, body hair, brow, face projection, nose, chin. Crop the face to check: at full size a heavy-browed modern face can pass for a Neanderthal.
6. Skin and hair follow the note. Across the set, older species are not darker.
7. Calm or mildly amused expression. Mouth closed. Not a caricature.
8. Photo style: photoreal studio look on the dark mottled backdrop, same light across the set, nothing ethnographic (see Sensitivity rule).

Regenerate a failure with `--only <key>`, at most twice per image. Put lasting fixes in `EXTRA` or the template. Use `--extra` only for one-off tests.

## Known fixes

Photo test (gpt-image-2), Neanderthal and A. afarensis:

- Try 1 (fixes appended at the end of the prompt): Neanderthal faces read as modern humans with big noses. Afarensis skin came out medium brown, fingertips only reached mid-thigh, legs near human length.
- Try 2: moved `{fix}` right after the anatomy note, added "neutral, colour-accurate white balance" to the style block, and used the stronger `EARLY_APE_FIX` below. Afarensis passed. Neanderthal faces still too modern. The hip garment was widened after a moderation block.
- Try 3: the concrete Neanderthal face text now in `EXTRA`. Male clearly Neanderthal. Female passes but is softer, so check her face first in the full run.

`EARLY_APE_FIX` (afarensis, Ardipithecus, Sahelanthropus):

```
Skin check, most important: every patch of bare skin (face, ears, palms, hands, feet) is pale pinkish-beige like a young chimpanzee's face, light with pink undertones, clearly not brown; only the dense hair covering the body is dark brown. Proportions check: arms much longer than a human's, the fingertips hanging level with the kneecaps; legs short, no longer than the torso; cone-shaped ribcage widening to a broad belly and pelvis. Face check: ape-like, closer to a chimpanzee than a human, with the jaws pushed far forward into a muzzle, a flat nose with no bridge, a low small braincase, no forehead and no chin.
```

Older Style B fix for the same species (pass with `--extra`): `Skin check: the face, ears, hands and feet are pale pinkish-beige, clearly lighter than the reference figure's skin and much lighter than the dark body hair, like a chimpanzee's pale skin. Proportions check: arms clearly longer than a human's, fingertips hanging down to the knees; legs short relative to the long torso; cone-shaped ribcage widening to a broad belly and pelvis.`

Every figure fills the frame, so a 1.05 m afarensis and a 1.80 m erectus show at the same size. Height reads from the notes and on-screen text, not from the picture.

## Running

The key comes from `OPENAI_API_KEY` (falls back to the Windows user environment variable).

```bash
python tools/generate_portraits.py --photo-test
python tools/generate_portraits.py --photo-test --only neanderthal-male,neanderthal-female
python tools/generate_portraits.py --contact-sheet
python tools/generate_portraits.py --all
python tools/generate_portraits.py --all --only homo-erectus-female,homo-erectus-male
python tools/generate_portraits.py --all --style B --anchor tools/out/full-body-test/neanderthal-male.png
python tools/generate_portraits.py --full-body-test
python tools/generate_portraits.py --style-test --style A
```

- `--photo-test`: photo style, Neanderthal and A. afarensis, female and male. The Neanderthal male is made first with `/v1/images/generations`. The other three use `/v1/images/edits` with it as a style, backdrop and lighting reference only. PNGs, `prompts.json` and a labelled 1x4 `contact-sheet.png` go to `tools/out/photo-test/`. Rejected tries are in `tools/out/photo-test/rejected/`.
- `--all`: every stage in `stages.json`, female then male, through `/v1/images/edits`. `--style` defaults to `photo` and `--anchor` to `tools/out/photo-test/neanderthal-male.png`. The anchor is always a reference; the male also gets that stage's female for a matching pair. Raw PNGs go to `tools/out/all/`. Each is saved uncropped at 1024x1536 (2:3) as WebP (quality 80) at `public/portraits/<stage-id>-<sex>.webp`.
- `--full-body-test`: Style B version of the photo test, into `tools/out/full-body-test/`.
- `--style-test`: the older A/B comparison (8 images) into `tools/out/style-test/`.
- `--contact-sheet`: rebuilds all three contact sheets from the PNGs on disk.
- `--only`: comma-separated keys (`<stage-id>-<sex>`, or `A-neanderthal-female` in the style test).
- `--extra`: text appended to every prompt in that run, for one-off tests.

Retries back off on 429, 5xx and network errors (5s, 10s, 20s ... up to 6 tries). A moderation block (HTTP 400) stops the run. Rerun the missing keys with `--only`.
