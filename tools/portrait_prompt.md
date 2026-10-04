# Portrait prompts

`tools/generate_portraits.py` builds every prompt from one locked template. Only the species slots change between images.

## Model

The script calls `GET /v1/models` and picks `gpt-image-2`, then `gpt-image-1.5`, then `gpt-image-1`. Override with `--model`. Every call uses `size 1024x1536` and `quality medium`.

## Template

```
{STYLE BLOCK}. Chest-up portrait, three-quarter view, head fills the upper 55% of a 4:5 frame, eyes at the upper third, centred, plain backdrop. Subject: an adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based on current museum reconstructions. Anatomy: {anatomy note}. Wearing {garment} that fully covers the chest and shoulders, high at the neck. Expression: {expression}, mouth closed, dignified. Natural proportions, no makeup, no jewellery, no modern items.
```

- `{anatomy note}` comes from `anatomy.female` / `anatomy.male` in `src/content/stages.json`. The script has its own Neanderthal and A. afarensis notes for the style test if the file or entry is missing.
- `{expression}`: female "calm and patient", male "calm, mildly amused".
- `{garment}` defaults to "a simple, roughly stitched animal-hide wrap".

Calls with a reference image (the edits endpoint) wrap the template:

- Before: "The reference image shows a different individual of a different species. Use it only as the reference for art style, lighting, colour grade, backdrop, framing and rendering. Create a new portrait of a new individual:"
- After: "Match the lighting, colour grade, framing and rendering of the reference images exactly."

## Style blocks

- **A, picture day:** `1990s school picture-day portrait photograph, mottled blue laser-swirl studio backdrop, soft frontal key light, slight film grain, photographic, natural skin texture`
- **B, oil portrait:** `formal 17th-century oil portrait painting, dark umber background, warm Rembrandt lighting on the face, visible brushwork, aged varnish`

## Prompt rules

- Never use "smash", "sexy", "attractive", "nude", "beautiful" or any comparison to modern ethnic groups. The script refuses to send a prompt that contains them.
- Keep game wording out of prompts. Describe clothing up front.
- Do not name Kennis & Kennis or John Gurche, and do not use their photos as references.
- Write skin, hair and body hair from current evidence and vary them. Never make older species darker.

## Review checklist (every image)

1. Fully clothed: the garment covers the chest and shoulders. No cleavage, no bare shoulders.
2. No glamour or sexualised posing. Ordinary, unretouched face.
3. No makeup, jewellery, piercings, tattoos or modern items.
4. Anatomy matches the note: brow, forehead, face projection, nose, chin, braincase, body hair.
5. Dignified, calm or mildly amused expression. Mouth closed. Not a caricature.
6. Skin and hair follow the note. Across the set, older species are not darker.
7. Reads at phone size: head large in the upper half of the 4:5 crop, plain backdrop.

Regenerate a failure with `--only <key> --extra "<fix>"`, at most twice per image.

Known bias (style test, gpt-image-2): the model renders A. afarensis skin medium-dark brown even when the note asks for pale beige-pink, and drifts the females towards a modern human face. Check item 6 across the whole set and plan a hand colour pass for the oldest species if prompts do not hold.

## Running

The key comes from `OPENAI_API_KEY` (falls back to the Windows user environment variable).

```bash
python tools/generate_portraits.py --style-test
python tools/generate_portraits.py --style-test --style B --only B-neanderthal-female --extra "..."
python tools/generate_portraits.py --contact-sheet
python tools/generate_portraits.py --all --style B --anchor tools/out/style-test/B-neanderthal-male.png
python tools/generate_portraits.py --all --style B --anchor tools/out/style-test/B-neanderthal-male.png --only homo-erectus-female,homo-erectus-male
```

- `--style-test`: Neanderthal and A. afarensis, female and male, styles A and B (8 images). In each style the Neanderthal male is made first with `/v1/images/generations`, then the other three use `/v1/images/edits` with it as the reference. PNGs, `prompts.json` and `contact-sheet.png` go to `tools/out/style-test/`.
- `--all --style X --anchor PATH`: every stage in `stages.json`, female then male, through `/v1/images/edits`. The anchor is always a reference; the male also gets that stage's female for a matching pair. Raw PNGs go to `tools/out/all/`. Each is centre-cropped from 1024x1536 to 4:5, resized to 1024x1280 and saved as WebP (quality 85) at `public/portraits/<stage-id>-<sex>.webp`.
- `--only`: comma-separated keys (`A-neanderthal-female` in the style test, `<stage-id>-<sex>` in `--all`).
- `--extra`: text appended to every prompt in that run, for targeted fixes.

Retries back off on 429, 5xx and network errors (5s, 10s, 20s ... up to 6 tries).
