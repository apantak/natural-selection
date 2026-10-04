# Portrait prompts

`tools/generate_portraits.py` builds every prompt from a locked template. Only the species slots change between images.

## Model

The script calls `GET /v1/models` and picks `gpt-image-2`, then `gpt-image-1.5`, then `gpt-image-1`. `KEY_MODEL` pins single keys to another model in `--all` and `--retouch` (heidelbergensis and Denisovan, both sexes, use `gpt-image-2.5-flare`). `--model` overrides both. Every call uses `size 1024x1536` and `quality medium` (about $0.04 per image).

## Style photo: full-length studio photograph (the game style, default)

A photorealistic picture-day shoot. The joke is that it looks like a real studio portrait. Whole standing figure in minimal period clothing, so the room can judge build and proportions.

```
{STYLE BLOCK}. Full-length standing portrait: the whole body from the top of the head to the soles of the bare feet is inside a vertical 2:3 frame, with a small margin above the head and below the feet, figure centred, standing on the studio floor where the backdrop sweeps down behind the feet. Natural, relaxed neutral stance, weight on both feet, arms relaxed at the sides, body turned slightly in three-quarter view, face towards the camera. Clothing: {clothing}. Subject: an adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based on current museum reconstructions, photographed exactly like any other customer at a portrait studio, not sexualised, no glamour or fashion-model styling. Anatomy and body: {anatomy note}. {fix}Arms, legs, shoulders, build and body hair clearly visible. Expression: {expression}, mouth closed. Natural proportions, no makeup, no jewellery, no modern items.
```

Style block: `Photorealistic full-length studio portrait photograph from a professional portrait studio's picture day: a dark mottled hand-painted canvas backdrop in charcoal and deep warm brown, classic portrait-studio muslin; professional softbox key light from the front left with soft fill, plus a soft rim light and hair light from behind that trace the head, hair, shoulders and arms with a thin warm glow so the figure separates cleanly from the dark backdrop; neutral, colour-accurate white balance so skin tones read true; sharp focus on the subject with natural photographic depth of field, the backdrop softly out of focus; true-to-life colour, natural skin texture with pores and fine hairs, shot on a full-frame camera with an 85mm lens; a clean modern commercial studio portrait, not a field, documentary or scientific photograph`

`{fix}` is built by `fix_text(stage, sex)` (photo style only) and sits right after the anatomy note so the model weighs it:

1. `EXTRA_SKIN[(stage, sex)]` if present. Neanderthal female: `Pale, freckled skin, not tanned.` Neanderthal male: `Light olive, weathered skin, not deeply tanned.`
2. `EXTRA[stage]`, the face check, identical for both sexes. Every stage except Homo sapiens has one:
   - `neanderthal`: low sloping forehead, rounded double-arched brow visor jutting over deep-set eyes, long low skull with a bulge at the back, cheekbones swept back, midface pushed forward around a large wide nose, long upper lip, receding chin with no chin point.
   - `denisovan`, `homo-heidelbergensis`, `homo-erectus`, `homo-floresiensis`, `homo-habilis`: short face checks built from their notes (forehead, brow, face projection, nose, chin). Untested in photo style.
   - `australopithecus-afarensis`, `ardipithecus-ramidus`, `sahelanthropus-tchadensis`: `EARLY_APE_FIX` (see Known fixes).
3. `EXTRA_SEX[(stage, sex)]` if present. For the seven heads in Head strategy below it starts with `archaic_head(fossil, sex)`.
4. Females also get `FEMALE_MATCH`: `She is just as archaic as the males of her species: the same forehead, brow ridge, midface, jaw, nose and chin, only slightly smaller and without a beard; her face must not look like a modern woman's.`

Without these the photo model draws modern faces with big noses, females more than males.

When a species keeps failing, add an `EXTRA` entry rather than relying on `--extra`.

### Head strategy (denisovan female, heidelbergensis, floresiensis, habilis)

These seven read as living older people with a heavy brow, so stronger face words alone did not help. `EXTRA_SEX` for each now uses `archaic_head(fossil, sex)`:

- Names the fossil the head is a museum reconstruction of (Harbin, Kabwe 1, LB1, KNM-ER 1813) and says it is an extinct species, not any living person.
- Hair cropped very short, close to the scalp (females too, no knot or bun), so the sloping forehead, long low skull and brow ridge show. "Tied back" still gave long loose hair.
- Head turned about 45 degrees, nose pointing past the camera, so brow, midface and jaw projection read in silhouette.
- Brow ridge casts a band of shadow over the eyes; low flat nose, no tall bridge; no chin. Wide face for Denisovan and heidelbergensis.
- Females add `YOUNG_FEMALE`: `About 30, smooth skin, no wrinkles, no facial hair.` Denisovan and heidelbergensis females also add `ARCHAIC_FEMALE` (face = the male's face without the beard, muzzle like the H. erectus reference). `ARCHAIC_FEMALE` is untested: the API ran out of credit before it could run.

`FACE_DONOR[(stage, sex)]` names a passing image (`<stage>-<sex>` key) as a face reference (`REF_FACE`): the H. erectus male for heidelbergensis (both sexes), A. afarensis of the same sex for floresiensis male and habilis. When the donor is the anchor, the anchor's own slot becomes the face reference (plus style), so it is not sent twice. Females also keep their own species' male as a same-species reference. The model takes the face and head shape from it but keeps the species' own build, height, skin, hair and body hair from the note. `--all` generates every stage without a donor first, so the donor images exist before they are used.

### Sensitivity rule

Every species gets the identical modern studio setup, light and treatment. Never an ethnographic, field or anthropometric look: no sepia, no outdoor field photo, no measuring rods or height charts, no front-and-profile mugshot framing, no "specimen" staging. Height reads from the on-screen text, not the picture.

## Clothing (all full-length styles)

`{clothing}` comes before the anatomy so the garment is the first thing the model reads:

- female: `minimal period clothing; a hide wrap that passes over one shoulder and fully covers her chest, like a simple one-shouldered hide top tied at the side, loose and unfitted, hanging straight down from the shoulder without shaping to the body, not a strapless band; and a wide hide wrap around the hips that fully covers the groin and buttocks and reaches mid-thigh; arms and lower legs bare`
- male: `minimal period clothing; a wide hide wrap around the hips that fully covers the groin and buttocks and reaches mid-thigh; arms and lower legs bare`

`CLOTHING[(stage, sex)]` overrides the slot for one species. Denisovan (both sexes) wears a heavy dark brown fur cloak over the shoulders (closed over the female's chest) and a mid-thigh fur hip wrap, for the cold-climate range (Siberia, Tibetan plateau).

The garment sentence at the end of each anatomy note (`Wears ...` / `Bare-chested, ...`) is cut off before the note goes in, so it cannot fight the clothing slot.

The one-shoulder top replaced a chest wrap that the model drew as a strapless band. The hip wrap replaced the old small "hide loincloth". A photoreal bare-chested male in a small loincloth was blocked once by output moderation (`moderation_blocked`, `sexual`). The mid-thigh wrap has passed every call since.

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

The garment sentence is cut from the anatomy note here too, so Style A's own chest wrap line is the only clothing.

## Shared slots

- `{anatomy note}` comes from `anatomy.female` / `anatomy.male` in `src/content/stages.json`. Each note describes the whole body, in this order: skin colour first (the model drifts darker), hair and body hair, height in metres and weight, build, limb proportions, posture, skull and face, then the garment. Keep each under about 70 words.
- `{expression}`: female "calm and patient", male "calm, mildly amused".

Calls with reference images (the edits endpoint) wrap the template. The first image is always the style anchor. Next comes the face donor when `FACE_DONOR` has one. A female then gets her own species' male when it exists, so she is built from the same skull and face. Each image is described by `reference_text()`:

- Different species: "{label} shows a different individual of a different species. Use it only as the reference for photographic style, studio backdrop, lighting, colour grade, framing and rendering. Do not copy its anatomy, face, skull, body proportions, skin colour, hair or clothing."
- Same species: "{label} shows another individual of the same species as the new portrait. [If first: Use it as the reference for photographic style, studio backdrop, lighting, colour grade, framing and rendering.] Use it as the reference for species anatomy: give the new individual the same skull, forehead, brow ridge, midface, nose, jaw and chin shapes, the same limb proportions and the same amount of body hair, adapted to a {sex}, as a clearly different person. Do not copy its skin colour, hair colour, clothing or pose."
- Face donor: "{label} shows an individual of a related extinct species, {species}. Use it as the reference for the shape of the face and head only: take its low sloping forehead, long low skull, brow ridge, low flat nose, forward-pushed jaws and chinless jaw line, so the new face is at least as archaic as this one and reads as an extinct species, never as a living person. Keep the new individual's own build, height, limb proportions, skin colour, hair and body hair exactly as described below. Do not copy its skin colour, body hair, clothing or pose."
- Then "Create a new portrait of a new individual:" and the template, ending with "Match the lighting, colour grade, framing and rendering of the reference images exactly."

The old wording called every reference "a different species", so the Neanderthal female was told not to copy the Neanderthal male's anatomy.

## Prompt rules

- Never use "smash", "sexy", "attractive", "nude", "naked", "beautiful" or any comparison to modern ethnic groups. The script refuses to send a prompt that contains them.
- Keep game wording out of prompts. Describe clothing before anatomy. If the API refuses, soften the anatomy wording or enlarge the garment, never shrink it.
- Do not name Kennis & Kennis or John Gurche, and do not use their photos as references.
- Write skin, hair and body hair from current evidence and vary them. Early African Homo and sapiens: dark skin. Neanderthals: variable, some light, red hair possible. Heavily haired early species (afarensis, Ardipithecus, Sahelanthropus): pale chimp-like skin under dense body hair.

## Review checklist (every image)

0. Face reads as an extinct archaic species, a museum reconstruction, and not as a living person or any living population. This is the critical failure.
1. Whole figure from head to feet in frame, small margin, vertical 2:3.
2. Female chest covered by a garment. Groin covered for both sexes.
3. Not nude, not sexualised, no suggestive pose, no glamour. Ordinary, unretouched face and body.
4. No makeup, jewellery, piercings, tattoos or modern items.
5. Anatomy and proportions match the note: build, limb lengths, posture, body hair, brow, face projection, nose, chin. Crop the face to check: at full size a heavy-browed modern face can pass for a Neanderthal.
6. Skin and hair follow the note. Across the set, older species are not darker.
7. Calm or mildly amused expression. Mouth closed. Not a caricature.
8. Photo style: photoreal studio look on the dark mottled backdrop, same softbox and soft rim light across the set, figure separates from the backdrop at phone size, nothing ethnographic (see Sensitivity rule).

Regenerate a failure with `--only <key>`, at most three times per image. Judge faces from a Pillow crop, never from the full frame. Put lasting fixes in `EXTRA` or the template. Use `--extra` only for one-off tests.

## Known fixes

Photo test (gpt-image-2), Neanderthal and A. afarensis:

- Try 1 (fixes appended at the end of the prompt): Neanderthal faces read as modern humans with big noses. Afarensis skin came out medium brown, fingertips only reached mid-thigh, legs near human length.
- Try 2: moved `{fix}` right after the anatomy note, added "neutral, colour-accurate white balance" to the style block, and used the stronger `EARLY_APE_FIX` below. Afarensis passed. Neanderthal faces still too modern. The hip garment was widened after a moderation block.
- Try 3: concrete Neanderthal face text in `EXTRA`. Male clearly Neanderthal (kept as the anchor). Reviewer failed both females: modern faces with big noses, not matching their males.
- Try 4: sex-aware fixes (`EXTRA_SKIN`, `FEMALE_MATCH`), face text for every archaic stage, stronger ape nose and eyes, one-shoulder top, rim and hair light. Neanderthal female better but still soft; afarensis female kept a human nasal bridge and human eyes.
- Try 5: same-species reference wording, and each female gets her male as a second reference. Neanderthal female passed. Afarensis female closer but still had a raised bridge between the eyes.
- Try 6 (afarensis female only): flat area between the eyes, eyes with almost no white. Face passed and matches the male. The top came out fitted and shaped to the bust, so the female garment now says "loose and unfitted, hanging straight down from the shoulder". That wording is not yet tested.

Head strategy run (seven failed heads, see Head strategy):

- Habilis male and female, floresiensis male and female: pass. Clearly archaic, australopith-like muzzle, flat nose, small skull, figure and garments fine.
- Heidelbergensis male: borderline pass. Brow, forward jaws and flat nose read archaic, but the brow shadow is light.
- Denisovan female (3 tries) and heidelbergensis female (1 try): still fail, both read as living women. Kept the least bad (`denisovan-female` try 1 with hair tied back, `homo-heidelbergensis-female` try with short hair and the most jaw projection). Short cropped hair alone made them read more modern, not less. The next step is `ARCHAIC_FEMALE`, written but not yet run (API credit ran out). Rejected tries are in `tools/out/full/rejected/` (`*-review3.png` are the images before this run).

Review 4 fixes (written into `EXTRA_SEX`, not yet run: the API ran out of credit again):

- Denisovan female: head turned 60 degrees (`archaic_head(..., turn)`), hair shaved to stubble, 45-degree forehead, finger-width brow bar shading the eyes, no nasal bridge, smooth unlined skin, "the Denisovan male reference's face without a beard". Erectus donor dropped.
- Heidelbergensis male: about 35, no forehead wrinkles or crow's feet, 45-degree forehead, Kabwe double-arched brow shading the eyes, no raised nasal bridge, midface far forward. Expression override in `EXPRESSIONS[(stage, sex)]`: "calm and neutral, no smile" (the smile added crow's feet and age).
- Heidelbergensis female: stubble hair so the long low vault shows, Kabwe brow arches, no nasal bridge, smooth skin, "the heidelbergensis male reference's skull without the beard". Erectus donor dropped.
- Floresiensis and habilis, both sexes: `smooth_skin(areas)` against the scaly, crackled skin and fuzzy hair halo. Females add `BARE_FEMALE_FACE` (no hair on chin, jaw, cheeks or upper lip; no crow's feet or forehead lines). Habilis braincase "clearly smaller than Homo erectus's". Floresiensis male "about 30, only light lines around the eyes".
- Run males before females: `--all --only homo-heidelbergensis-male,homo-floresiensis-male,homo-habilis-male,denisovan-female`, review, then the three other females. The images before this round are `tools/out/full/rejected/*-review4.png`.

Review 5 fixes (the review 4 text never ran, so the images were reviewed again; written into the tool, not yet run: no API credit):

- `archaic_head(fossil, sex, turn, hair)` now takes a hair override.
- Denisovan female: strict left-facing profile at 70-80 degrees, scalp shaved bare like a mannequin's, 2 cm brow bar with the eyes as shadowed slits, 45-degree forehead ramp, nose root sunk level with the inner eye corners, jaws 3 cm in front of the nose base, no chin bump, "the Denisovan male scaled down 5% without the beard", silicone museum reconstruction.
- Heidelbergensis male: 70-degree profile, hair buzzed to 2 mm, forehead a flat 45-degree ramp, brow puts both eyes in solid black shadow, nose root level with the eye corners, jaws more projecting than a Neanderthal's, glass-smooth forehead, expression "neutral, no smile".
- Heidelbergensis female: 70-degree profile, shaved scalp, Kabwe brow arches with the eyes in shadow, flat nose root, short muzzle, no chin bump, glass-smooth skin, "the exact face of the heidelbergensis male without the beard".
- Floresiensis and habilis females: faces passed, so "keep this face shape and skull". `BARE_FEMALE_FACE` now bans whiskers, bristles, stubble and beard shadow and says body hair stops at the neck. `smooth_skin` now bans crackle, crazing, scales, cell pattern, polygon lines and dry-clay texture. `REF_FACE` now also says not to copy the donor's skin texture or facial hair (the afarensis donor has both).
- Run `--all --only homo-heidelbergensis-male,denisovan-female,homo-floresiensis-female,homo-habilis-female`, review the male, then `--only homo-heidelbergensis-female`.

Try 7 (max 2 tries per key; images before it are `rejected/*-review5.png`, rejected tries `rejected/*-t7a1.png`):

- Heidelbergensis male, Denisovan and heidelbergensis females: Neanderthal male anchor as face donor, head turned about 60 degrees, stubble scalp, "museum silicone reconstruction of the Kabwe 1 / Harbin skull", neutral closed mouth (`ARCHAIC_NEUTRAL`), no raised nasal bridge. `EXTRA` nose for both species is now "very wide, low, flat" (was "very large").
- Heidelbergensis male: passed on try 1 (gpt-image-2). Heavy brow, sloping forehead, forward face; nose still a little fleshy.
- Both archaic females on gpt-image-2 read as living people with buzz cuts. Try 2 added `ARCHAIC_FACE_FORWARD` (face in front of the braincase, eyes barely visible, thin lips on a bulging upper lip) and ran on `gpt-image-2.5-flare`. Both now read archaic and match the set's backdrop and light. Kept. Remaining fault: light stubble shadow on the jaw (heidelbergensis more than Denisovan). `BARE_FEMALE_FACE` then got "jaw, cheeks and upper lip are bare skin the same colour as the forehead" (untested).
- Floresiensis and habilis females: new `BARE_FEMALE_FACE` (hairless below the brow, no cracked or crazed pattern); `REF_FACE` and `REF_SAME_SPECIES` now forbid copying skin texture and facial hair. Habilis try 1 lost the muzzle (modern face); try 2 kept the donor and added "keep the australopith-like muzzle". Floresiensis try 2 dropped the afarensis donor (its fuzzy bristle halo); the male pair still gives the face. Both kept from try 2: faces pass, skin smoother, but a few chin whiskers and faint jaw shadow remain (the males' stubble and crackled skin still leak through the pair reference).

`EARLY_APE_FIX` (afarensis, Ardipithecus, Sahelanthropus):

```
Skin check, most important: every patch of bare skin (face, ears, palms, hands, feet) is pale pinkish-beige like a young chimpanzee's face, light with pink undertones, clearly not brown; only the dense body hair is dark. Proportions check: arms much longer than a human's, the fingertips hanging level with the kneecaps; legs short, no longer than the torso; cone-shaped ribcage widening to a broad belly and pelvis. Face check, most important: an ape's face, closer to a chimpanzee than a human. The jaws and mouth push far forward into a strong muzzle, so in three-quarter view the lower face sticks out well past the nose; the nose is flat against the face like a chimpanzee's, just two wide nostrils with no bridge, no human nasal bridge and no nose tip sticking out, and the area between the eyes is flat and wide with no raised ridge running down to the nose; small, ape-like dark brown eyes with almost no white showing, set deep under a heavy brow ridge; a low small braincase with no forehead; no chin.
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

- `--photo-test`: photo style, Neanderthal and A. afarensis, female and male. The Neanderthal male is made first with `/v1/images/generations`. The other three use `/v1/images/edits` with it as the style reference. Males are made before females, and each female also gets her species' male as an anatomy reference. PNGs, `prompts.json` and a labelled 1x4 `contact-sheet.png` go to `tools/out/photo-test/`. Rejected tries are in `tools/out/photo-test/rejected/`.
- `--all`: every stage in `stages.json`, male then female, through `/v1/images/edits`. `--style` defaults to `photo` and `--anchor` to `tools/out/photo-test/neanderthal-male.png`. The anchor is always the first reference (treated as same species when its file name matches the stage). The female also gets that stage's male from `tools/out/full/`, so rerunning a female alone still pairs her with the existing male. Raw PNGs and `prompts.json` go to `tools/out/full/`, with a labelled `contact-sheet.png`. Each is saved uncropped at 1024x1536 (2:3) as WebP (quality 80) at `public/portraits/<stage-id>-<sex>.webp`.
- `--full-body-test`: Style B version of the photo test, into `tools/out/full-body-test/`.
- `--style-test`: the older A/B comparison (8 images) into `tools/out/style-test/`.
- `--contact-sheet`: rebuilds all three contact sheets from the PNGs on disk.
- `--retouch --only KEY[,KEY]`: sends the key's own `tools/out/full/<key>.png` back through `/v1/images/edits` with `RETOUCH_PROMPT` + `RETOUCH[key]` (keep everything, change only the skin), then rewrites the PNG, WebP and contact sheet. Back the PNG up first. Use it only for skin, age and facial hair on a face that already passes.
- `--only`: comma-separated keys (`<stage-id>-<sex>`, or `A-neanderthal-female` in the style test).
- `--extra`: text appended to every prompt in that run, for one-off tests.

Retries back off on 429, 5xx and network errors (5s, 10s, 20s ... up to 6 tries). A moderation block (HTTP 400) or an `insufficient_quota` 429 (no API credit) stops the run. Rerun the missing keys with `--only`.

## Try 8 (after review 6)

Images before this round are `rejected/*-review6.png`. Rejected tries are `rejected/*-t8a1.png` and `*-t8a2.png`. Logs: `tools/out/t8-*.log`.

Tool changes:

- Heidelbergensis male and female and the Denisovan female `EXTRA_SEX` rewritten from the reviewer fixes and cut down (prompts went from about 1250 to 1100 words). Dropped the stacked `ARCHAIC_FACE_FORWARD`, `ARCHAIC_FEMALE` (it made the females copies of the male's face, so they read as men) and `HEAD_STUBBLE` (the buzz cut read as a living man).
- `ARCHAIC_HAIR`: short, thick, untidy hair swept back off the forehead, not a buzz cut.
- `ARCHAIC_SHADE`: the softbox sits high so the brow puts the eye sockets in shadow; short, broad, flat nose with no fleshy tip, the mouth sticking out further than the nose.
- `YOUNG_SKIN`: positive wording (soft, smooth, even, matte, fine pores). It replaces the lists of banned textures for these keys, which seemed to prime the crackle.
- `FACE_DONOR` for those three is now `homo-erectus-male`. The Neanderthal anchor's large fleshy nose was being copied as a raised bridge.
- New `--retouch` mode with `RETOUCH` entries for the floresiensis and habilis females.

Results:

- Heidelbergensis male (3 tries in all, 2 this round): try 1 on gpt-image-2 with the Neanderthal donor came out as a copy of the anchor (fleshy bridged nose, eyes lit). Try 2 on flare with the erectus donor: kept. Heavy brow, low sloping forehead, long convex upper lip, the midface clearly forward, dark trimmed beard, swept-back hair. The eyes are only partly shaded and a faint crackle remains on the upper arm.
- Heidelbergensis female (4 in all): try 1 on flare with the new male as pair: kept. Archaic face (brow, sloping forehead, forward mouth), the hide top lies flat with no outline. Faint speckle on the jaw and light forehead lines remain, and the face is fairly masculine. Try 2, a retouch on gpt-image-2 ("clearly a woman, softer cheeks, no stubble") made her young and clean but shrank the brow and stood the forehead up, so she read as a living woman. Rejected. Do not retouch face shape: retouching modernises archaic faces.
- Denisovan female (4 in all, cap reached): try 1 on gpt-image-2 came out as a living woman with long hair. Try 2 on flare with the erectus donor: kept as the least bad. Female, smooth jaw, heavy brow and sloping forehead, but the nose is still fleshy and the long hair softens the archaic read. Likely still fails review on crit 1. The Denisovan male pair (fleshy nose, long hair) probably drives this. A new male would be the next step.
- Floresiensis female (4 in all, cap reached): two retouches of the review-6 image. Kept try 2: young, smooth face with no whiskers, and the muzzle is unchanged. A faint net pattern is still on the upper arm. Each retouch darkens the backdrop a little (corner mean 26/24/21, then 24/22/19, then 22/19/16, against a set of about 29-33). Visible on the contact sheet but still the same backdrop.
- Habilis female (3 in all): one retouch of the review-6 image. Pass. About 30, smooth hairless face, the muzzle is unchanged, and the skin is much smoother (a faint trace on the arm). The brow is still modest. Backdrop 24/22/20.
- The kept floresiensis and habilis females are retouches. `--all` will not recreate them. A fresh `--all` run for those keys has to be followed by `--retouch`.

## Try 9 (Denisovan made distinct from heidelbergensis)

The Denisovan pair looked the same as the heidelbergensis pair (same erectus-donor face, profile head, hide clothes). Images before this round are `rejected/denisovan-*-pre9.png`. Rejected tries are `rejected/denisovan-*-t9a*.png`. Logs: `tools/out/t9-*.log`.

Tool changes:

- `EXTRA["denisovan"]` now describes the Harbin "Dragon Man" skull (Denisovan per the 2025 protein and mtDNA studies): very large long low braincase, thick but straight, level brow bar, large almost square eye sockets, very wide flat face with broad flat forward-facing cheekbones, flat midface (not drawn forward like a Neanderthal's), very broad flat nose, wide mouth over big broad jaws with very large molars, no chin.
- New `harbin_head(hair)` for both Denisovan `EXTRA_SEX` entries: silicone museum reconstruction of the Harbin skull, head turned only about 30 degrees so the face width shows, groove above the brow then a 45-degree forehead into a long low skull, brow shelf shading the square eye sockets, flat nose root, jaws bulging past the nose base, dark brown skin, brown eyes. Plus `ARCHAIC_SHADE` and `ARCHAIC_NEUTRAL`.
- Male: short rough straight black hair lying close to the head, thin sparse beard, about 35. Female: straight black hair pulled back and tied at the nape, plus `BARE_FEMALE_FACE` and `YOUNG_SKIN`.
- `CLOTHING[("denisovan", sex)]`: fur cloak and fur hip wrap (see Clothing). `build_prompt` reads it before the per-sex default.
- Denisovan female `FACE_DONOR` removed. The Neanderthal anchor is now only the style reference (`REF_STYLE`: not for face). The female still gets the new male as her same-species pair.
- `KEY_MODEL` adds `denisovan-male` (flare). `EXPRESSIONS` adds the male: "neutral, no smile".

Results (all on `gpt-image-2.5-flare`; no gpt-image-2 fallback was needed):

- Denisovan male (3 tries, cap reached): try 1 had a wide face and the fur cloak but read as a living older man (upright lined forehead, fleshy bridged nose, lit eyes, full curly beard). Try 2 added the brow groove, the 45-degree forehead and straight hair: a little better. Try 3 added `ARCHAIC_SHADE`, hair close to the head, jaws forward. Kept: thick brow shelf, sloping forehead, wide flat face, straight close black hair, sparse beard, fur cloak. Faint forehead lines and a slight nose bridge remain.
- Denisovan female (3 tries, cap reached): try 1 kept. Archaic (brow shelf, sloping forehead, wide face), hair tied back, fur cloak closed over the chest, hip wrap. She looks older than 30 and a little masculine, with faint jaw shadow and forehead lines. Try 2 ("softer, fuller cheeks, not a frown") and try 3 ("clearly a woman, smooth forehead") both added chin stubble and read more male. The male pair's beard and lines leak through. The tool holds the try 1 wording.
- Distinct from heidelbergensis at phone size: near-frontal wide face against heidelbergensis' profile, straight black hair, and a dark fur cloak against the hide wraps. See `tools/out/full/compare-archaic.png` (face crops of Neanderthal, Denisovan, heidelbergensis and erectus, male and female rows).
- Backdrop and light match the set (corner means 23/21/19 and 36/32/29, anchor 19/18/16 and 32/29/26).

## Try 10 (Denisovan vs heidelbergensis, after review 9)

Review 9 failed both Denisovans on crit A: long brown hair tied back, the same 3/4 pose and a long face, so they matched the heidelbergensis pair. Only the fur set them apart. Images before this round are `rejected/denisovan-*-pre10.png`. Rejected tries are `rejected/denisovan-*-t10a1.png`. Logs: `tools/out/t10-*.log`. Max 2 tries per key, all on `gpt-image-2.5-flare`.

Tool changes:

- `harbin_head(hair)` rewritten. Head turned only about 15 degrees (heidelbergensis uses 45 to 70). Hard width numbers: cheekbones 1.5 times the forehead width, moon-shaped face as wide as tall, square eye sockets more than an eye-width apart, mouth corners past the pupils, thin flat lips, huge square jaws, no chin. Brow bar "as thick as a thumb" with a groove above it, and "from the front almost no forehead shows above the brow bar". No nose bridge at all. "Clearly unlike the Kabwe / heidelbergensis reconstruction (long, narrow, forward-drawn face)". The old "jaws bulge forward past the nose" line is gone.
- New `HARBIN_HAIR` for both sexes: jet-black, coarse, straight, lank, cropped to about 1 cm, lying flat like short fur, not curly, not long, braided or tied back.
- Male: only sparse black stubble on the jaw, no full beard; "about 30 with smooth, unlined skin".
- Female: built on the male reference's skull and face shape "but unmistakably a woman" (smaller, smoother, softer face, rounder cheeks, lighter jaw, hairless chin, jaw and lip), the same width numbers, "not a living woman and not any living population". Expression is now "calm and relaxed, not frowning, no smile" (the neutral face read as a scowl).

Results:

- Male (2 tries, cap reached): try 1 was near-frontal, wide and short-haired but read as a living older man (upright lined forehead, fleshy lips, curly crop, heavy stubble). Try 2 (thumb-thick brow shelf with groove, no forehead above it, thin lips, smooth skin) kept. Clearly distinct from heidelbergensis at phone size: frontal wide face, short black crop, fur cloak. Strong brow shelf reads archaic. Faint forehead lines, a slight nose bridge and a curly texture in the crop remain.
- Female (2 tries, cap reached): try 1 copied the male (scowl, stubble shadow), so she read as a man. Try 2 kept: same Denisovan face, less scowl, chest fully covered by the closed cloak. Still fails crit C: masculine, faint chin and jaw stubble, faint forehead lines. The male pair's stubble leaks through. The 1 cm crop on a female also reads male. Next step if needed: a `--retouch` limited to skin (smooth chin and jaw, no lines), since retouching face shape modernises archaic faces.
- Backdrop corners 20/18/16 and 32/29/27 (male), 20/19/16 and 32/30/27 (female), anchor 17/16/14 and 28/26/24.
- `tools/out/full/compare-archaic.png` rebuilt (face crops, Neanderthal, Denisovan, heidelbergensis, erectus).

## Try 11 (both females given hair, Denisovan female made a woman)

The Denisovan female read as a copy of the male (stubble, 1 cm crop, masculine). The floresiensis female was almost bald. Images before this round are `rejected/*-pre11.png` (and `rejected/compare-archaic-pre11.png`). Rejected tries are `rejected/*-t11a1.png`. Logs: `tools/out/t11-*.log`. Max 2 tries per key, 4 calls in all.

Tool changes:

- `HARBIN_HAIR` is now a dict by sex. Male: the 1 cm crop as before. Female: jet-black straight hair to the shoulders, parted in the middle, combed back off the forehead, two plaits in front of the shoulders, not tied at the nape.
- New `NO_PAIR` set: `references()` skips the male pair for these female keys. Denisovan female is in it, so she only gets the Neanderthal anchor as a style reference. The male's stubble and forehead lines no longer leak in.
- Denisovan female `EXTRA_SEX`: no longer "built on the male reference". Female cues are the plaits, a hairless smooth face, slimmer neck, narrower shoulders and slightly finer features. The face bones stay "as heavy and archaic as a Denisovan man's": brow shelf hiding the upper eyelids, hairline just above the brow bar, no bridge, broad flat wedge nose, no chin. `YOUNG_SKIN` dropped and `ARCHAIC_TAIL` added for this key.
- Floresiensis female: `archaic_head(..., hair=...)` with dark wavy hair to the shoulders pushed back behind the ears. `smooth_skin(...)` swapped for `YOUNG_SKIN`. "Keep this face shape" now points at the male reference's skull and muzzle.

Results:

- Denisovan female (2 tries, flare): try 1 was clearly a woman with plaits and a hairless face. It failed as archaic: thin brow, upright forehead, a fleshy nose and lit eyes, so she read as a living woman. Try 2 (heavier bone wording) kept: plaits, smooth jaw, a thicker brow shelf, a low sloping hairline and a wide flat face. The fur cloak is closed over the chest. Remaining faults: she looks closer to 40 than 30 (nasolabial folds, a light frown), the nose is still fleshy, the eyes are not shaded and there is a faint speckle under the chin. She is less archaic than the male, but now reads as female and as a different person.
- Floresiensis female: try 1 was a fresh `--all` on gpt-image-2 with the male pair. Wavy shoulder-length hair pushed back, the muzzle and sloping forehead kept, tiny build and clothing fine. Skin failed: crackle and net lines on the shoulder and face, forehead lines, looked about 45. Try 2 was one `--retouch` of try 1 (`RETOUCH` entry unchanged, gpt-image-2). Kept: smooth young skin, no whiskers, hair and muzzle unchanged. The brow got a little lighter and the eyes show more white. The pre-11 image was a stack of two retouches. This is one retouch on a fresh image.
- Backdrop corners: Denisovan female 19/17/15 and 32/29/26, floresiensis female 19/18/16 and 30/25/21. The pre-11 floresiensis was 8/7/4 and 19/16/12, so the new one matches the set better.
- The kept floresiensis female is again a retouch. A fresh `--all` for that key must be followed by `--retouch`.
- `contact-sheet.png` rebuilt. `compare-archaic.png` has the new Denisovan female tile (crop 220,20 to 740,540).
