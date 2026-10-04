import argparse
import base64
import io
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
STAGES_JSON = ROOT / "src" / "content" / "stages.json"
PORTRAITS_DIR = ROOT / "public" / "portraits"
OUT_DIR = ROOT / "tools" / "out"
STYLE_TEST_DIR = OUT_DIR / "style-test"
FULL_BODY_DIR = OUT_DIR / "full-body-test"
PHOTO_DIR = OUT_DIR / "photo-test"
ALL_RAW_DIR = OUT_DIR / "full"
API = "https://api.openai.com/v1"
SIZE = "1024x1536"
QUALITY = "medium"
SEXES = ("male", "female")
TEST_STAGES = ("neanderthal", "australopithecus-afarensis")

PORTRAIT_TEMPLATE = (
    "{style}. Chest-up portrait, three-quarter view, head fills the upper 55% of a 4:5 frame, eyes at "
    "the upper third, centred, plain backdrop. Subject: an adult {sex} {species}, about 30 years old, an "
    "ordinary unretouched individual, scientifically based on current museum reconstructions. "
    "Anatomy: {anatomy}. Wearing a simple, roughly stitched animal-hide wrap that fully covers the chest "
    "and shoulders, high at the neck. Expression: {expression}, mouth closed, dignified. Natural "
    "proportions, no makeup, no jewellery, no modern items."
)

FULL_BODY_TEMPLATE = (
    "{style}. Full-length standing figure: the whole body from the top of the head to the soles of the "
    "bare feet is inside a vertical 2:3 frame, with a small margin above the head and below the feet, "
    "figure centred. Natural, neutral standing pose, weight on both feet, arms relaxed at the sides, body "
    "turned slightly in three-quarter view, face towards the viewer. Clothing: {clothing}. Subject: an "
    "adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based "
    "on current museum reconstructions, shown as a sober museum-style figure study, not sexualised. "
    "Anatomy and body: {anatomy}. Arms, legs, shoulders, build and body hair clearly visible. Expression: "
    "{expression}, mouth closed, dignified. Natural proportions, no makeup, no jewellery, no modern items."
)

PHOTO_TEMPLATE = (
    "{style}. Full-length standing portrait: the whole body from the top of the head to the soles of the "
    "bare feet is inside a vertical 2:3 frame, with a small margin above the head and below the feet, "
    "figure centred, standing on the studio floor where the backdrop sweeps down behind the feet. Natural, "
    "relaxed neutral stance, weight on both feet, arms relaxed at the sides, body turned slightly in "
    "three-quarter view, face towards the camera. Clothing: {clothing}. Subject: an adult {sex} {species}, "
    "about 30 years old, an ordinary unretouched individual, scientifically based on current museum "
    "reconstructions, photographed exactly like any other customer at a portrait studio, not sexualised, "
    "no glamour or fashion-model styling. Anatomy and body: {anatomy}. {fix}Arms, legs, shoulders, build and "
    "body hair clearly visible. Expression: {expression}, mouth closed. Natural proportions, no makeup, no "
    "jewellery, no modern items."
)

STYLES = {
    "photo": (
        "Photorealistic full-length studio portrait photograph from a professional portrait studio's picture "
        "day: a dark mottled hand-painted canvas backdrop in charcoal and deep warm brown, classic "
        "portrait-studio muslin; professional softbox key light from the front left with soft fill, plus a "
        "soft rim light and hair light from behind that trace the head, hair, shoulders and arms with a thin "
        "warm glow so the figure separates cleanly from the dark backdrop; neutral, colour-accurate white "
        "balance so skin tones read true; sharp focus on the subject with natural photographic depth of "
        "field, the backdrop softly out of focus; true-to-life colour, natural skin texture with pores and fine hairs, shot on a "
        "full-frame camera with an 85mm lens; a clean modern commercial studio portrait, not a field, "
        "documentary or scientific photograph",
        PHOTO_TEMPLATE,
    ),
    "A": (
        "1990s school picture-day portrait photograph, mottled blue laser-swirl studio backdrop, "
        "soft frontal key light, slight film grain, photographic, natural skin texture",
        PORTRAIT_TEMPLATE,
    ),
    "B": (
        "Grand-manner full-length oil portrait painting in the tradition of 18th-century aristocratic "
        "full-length portraits, solemn and formal, plain dark umber painted backdrop with a faint hint of "
        "distant landscape and dusky sky near the lower edge, warm directional light from the upper left, "
        "visible brushwork, aged varnish",
        FULL_BODY_TEMPLATE,
    ),
}

CLOTHING = {
    "female": (
        "minimal period clothing; a hide wrap that passes over one shoulder and fully covers her chest, "
        "like a simple one-shouldered hide top tied at the side, loose and unfitted, hanging straight down "
        "from the shoulder without shaping to the body, not a strapless band; and a wide hide wrap "
        "around the hips that fully covers the groin and buttocks and reaches mid-thigh; arms and lower legs "
        "bare"
    ),
    "male": (
        "minimal period clothing; a wide hide wrap around the hips that fully covers the groin and buttocks "
        "and reaches mid-thigh; arms and lower legs bare"
    ),
}

REF_LABELS = ("The first reference image", "The second reference image")

REF_STYLE = (
    "{label} shows a different individual of a different species. Use it only as the reference for "
    "photographic style, studio backdrop, lighting, colour grade, framing and rendering. Do not copy its "
    "anatomy, face, skull, body proportions, skin colour, hair or clothing. "
)

REF_SAME_SPECIES = (
    "{label} shows another individual of the same species as the new portrait.{style} Use it as the "
    "reference for species anatomy: give the new individual the same skull, forehead, brow ridge, midface, "
    "nose, jaw and chin shapes, the same limb proportions and the same amount of body hair, adapted to a "
    "{sex}, as a clearly different person. Do not copy its skin colour, hair colour, clothing or pose. "
)

REF_STYLE_ALSO = (
    " Use it as the reference for photographic style, studio backdrop, lighting, colour grade, framing "
    "and rendering."
)

REFERENCE_INTRO = "Create a new portrait of a new individual: "

REFERENCE_SUFFIX = " Match the lighting, colour grade, framing and rendering of the reference images exactly."

BANNED = ("smash", "sexy", "attractive", "nude", "naked", "hot", "beautiful", "race", "ethnic")

EARLY_APE_BODY = (
    "Skin check, most important: every patch of bare skin (face, ears, palms, hands, feet) is pale "
    "pinkish-beige like a young chimpanzee's face, light with pink undertones, clearly not brown; only the "
    "dense body hair is dark. Proportions check: arms much longer than a human's, the fingertips hanging "
    "level with the kneecaps; legs short, no longer than the torso; cone-shaped ribcage widening to a broad "
    "belly and pelvis. Face check, most important: an ape's face, closer to a chimpanzee than a human. "
)

APE_NOSE_EYES = (
    "the nose is flat against the face like a chimpanzee's, just two wide nostrils with no bridge, no human "
    "nasal bridge and no nose tip sticking out, and the area between the eyes is flat and wide with no "
    "raised ridge running down to the nose; small, ape-like dark brown eyes with almost no white showing"
)

EARLY_APE_FIX = EARLY_APE_BODY + (
    "The jaws and mouth push far forward into a strong muzzle, so in three-quarter view the lower face "
    "sticks out well past the nose; " + APE_NOSE_EYES + ", set deep under a heavy brow ridge; a low small "
    "braincase with no forehead; no chin. "
)

TOUMAI_FIX = EARLY_APE_BODY + APE_NOSE_EYES[0].upper() + APE_NOSE_EYES[1:] + "; no chin. "

ARCHAIC_LEAD = (
    "Face check, most important: the head must read at a glance as an extinct archaic human species, at "
    "least as archaic-looking as a Neanderthal, never as a modern human of any living population. "
)

EXTRA = {
    "neanderthal": (
        "Face check, most important: the head must read at a glance as Neanderthal, never as a modern human "
        "with a big nose. A low sloping forehead runs straight back from the brow, with no upright forehead, "
        "and the long low skull runs far back to a bulge at the back of the head. The brow ridge is a thick, "
        "rounded double-arched bony visor jutting well out over the eyes, casting the deep-set eyes into "
        "shadow. The cheekbones sweep back towards the ears, and the whole midface is pushed forward around "
        "a large wide nose, as wide as the mouth, so in three-quarter view the face looks drawn out "
        "forwards; a long upper lip; a large jaw with a receding chin and no chin point. "
    ),
    "denisovan": ARCHAIC_LEAD + (
        "A huge, long, low skull with a flat forehead that slopes straight back from the brow; a massive, "
        "thick bar of brow ridge jutting far out over large square eye sockets, casting the eyes into shadow; "
        "a very broad, tall, flat face with wide cheekbones; a very large, wide nose; a long upper lip over a "
        "wide mouth; a huge, deep jaw pushed forward with very large teeth and a receding chin with no chin "
        "point. "
    ),
    "homo-heidelbergensis": ARCHAIC_LEAD + (
        "A long, low skull with a low forehead sloping straight back from the brow; a very large, thick, "
        "double-arched brow ridge forming a heavy bony bar jutting out over deep-set eyes; a long, broad face "
        "with the midface pushed forward around a very large, wide nose; a long upper lip; a massive, deep "
        "jaw with a receding chin and no chin point. "
    ),
    "homo-erectus": ARCHAIC_LEAD + (
        "A long, low, narrow skull with a flat forehead sloping sharply back from the brow; a thick, "
        "straight, continuous shelf of brow ridge jutting out over the eyes like a visor; the lower face and "
        "jaws pushed well forward past the nose, so in three-quarter view the mouth sticks out; a broad, flat "
        "nose with wide nostrils; a long upper lip; a big jaw with a receding chin and no chin point. "
    ),
    "homo-floresiensis": ARCHAIC_LEAD + (
        "A very small, low skull with a forehead sloping sharply back; a rounded brow ridge jutting over the "
        "eyes; the lower face and jaws pushed forward past the nose; a broad, flat nose; large teeth behind a "
        "long upper lip; a receding jaw with no chin point. "
    ),
    "homo-habilis": ARCHAIC_LEAD + (
        "A small rounded braincase, much smaller than ours, with a low sloping forehead; a brow ridge over the "
        "eyes; the lower face and jaws pushed well forward past the nose into a short muzzle, so in "
        "three-quarter view the mouth sticks out; a flat, broad nose with a low bridge and wide nostrils; a "
        "long upper lip; a receding jaw with no chin. "
    ),
    "australopithecus-afarensis": EARLY_APE_FIX,
    "ardipithecus-ramidus": EARLY_APE_FIX,
    "sahelanthropus-tchadensis": TOUMAI_FIX,
}

ARCHAIC_TAIL = (
    "If in doubt, make the brow ridge, the sloping forehead and the forward-pushed jaws bigger, not smaller: "
    "the face must not look like any living person. "
)

EXTRA_SEX = {
    ("denisovan", "male"): (
        "Head turned well into three-quarter view, almost profile, so the forward projection of the face is "
        "obvious. Short hair off the forehead. The brow ridge is a single continuous bony shelf as thick as a "
        "thumb, running unbroken across both eyes and sticking out past the eye sockets like a roof, with a "
        "deep notch above it where the flat forehead starts. The cheekbones are very wide and flat, the face at "
        "least a third wider than a modern man's. The nose is very wide and flat, with nostrils as wide as the "
        "mouth and almost no bridge. The upper and lower jaws push forward in front of the eyes. A long, convex "
        "upper lip bulges over very large teeth. The beard is trimmed short so the receding chinless jaw line "
        "shows. "
    ) + ARCHAIC_TAIL,
    ("denisovan", "female"): (
        "Hair tied back tightly behind the head so the whole low, flat, sloping forehead and the long low skull "
        "show. Head turned well into three-quarter view, almost profile. A thick continuous bony brow shelf "
        "sticks out past the eye sockets like a roof, with a groove above it. A very broad, flat face with wide "
        "flat cheekbones. A very wide, flat nose with almost no bridge. The jaws push forward in front of the "
        "eyes, with a long convex upper lip over very large teeth. The jaw line slopes straight back from the "
        "lower lip with no chin. About 30 years old, smooth skin, no deep wrinkles, no facial hair. The same "
        "massive skull as the male, only slightly smaller. "
    ) + ARCHAIC_TAIL,
    ("homo-heidelbergensis", "male"): (
        "Head turned well into three-quarter view, almost profile. Short hair swept back so the low forehead "
        "shows, sloping straight back. A huge double-arched brow ridge, two thick bony arches each bulging out "
        "over one eye and joined over the nose, sticking out past the eyes like the Kabwe skull. Deep hollow "
        "shadows under it. The whole midface pushes forward so the nose sits well in front of the cheeks. A very "
        "large, broad nose with flaring nostrils and a low bridge. A long upper lip and a massive deep jaw. The "
        "beard is cut short so the chinless jaw slopes back visibly. Make the face clearly more archaic than the "
        "Neanderthal male. The brow ridge is the first thing anyone notices: so thick and far forward that the "
        "eyes sit in black shadow beneath it and only a glint of each eye shows. It must not look like the face "
        "in the reference image. "
    ) + ARCHAIC_TAIL,
    ("homo-heidelbergensis", "female"): (
        "No facial hair at all: smooth, hairless chin, jaw and upper lip. About 30 years old, no deep wrinkles. "
        "Hair tied back behind the head so the low sloping forehead shows. Head turned almost to profile. A huge "
        "double-arched bony brow ridge juts out past the eyes with deep shadow under it. The midface pushes "
        "forward so the broad, low-bridged nose sits well in front of the cheeks. A long upper lip, a massive "
        "deep jaw and no chin, the jaw line sloping straight back. The same heavy skull as the male, only "
        "slightly smaller. The brow ridge is the first thing anyone notices: so thick and far forward that the "
        "eyes sit in shadow beneath it. Young, firm, smooth skin with no sagging. "
    ) + ARCHAIC_TAIL,
    ("homo-erectus", "male"): (
        "The head looks like a Turkana Boy / Sangiran 17 museum reconstruction, not a person. A very long, "
        "low, narrow skull that clearly sticks out at the back. The forehead is almost flat and slopes sharply "
        "back from the brow, and the short hair does not hide it. A thick, straight, continuous shelf of brow "
        "ridge juts out over the eyes like a visor. The lower face and jaws push far forward past the nose, so "
        "in three-quarter view the mouth sticks out in a short muzzle. A broad flat nose with no high bridge. A "
        "long upper lip. No chin: the jaw slopes back from the lower lip. Head turned to three-quarter view. "
        "More archaic than a Neanderthal. "
    ),
    ("homo-erectus", "female"): (
        "A very long, low, narrow skull sticking out at the back. A flat forehead sloping sharply back from a "
        "thick, straight, continuous visor-like brow shelf, fully visible below short hair. The lower face and "
        "jaws push far forward past a broad, flat, low-bridged nose, so in three-quarter view the mouth sticks "
        "out in a short muzzle. A long upper lip, and no chin: the jaw slopes back. Head turned to "
        "three-quarter view. The same skull as the male of her species, only slightly smaller. "
    ),
    ("homo-floresiensis", "male"): (
        "Head turned well into three-quarter view, almost profile. Very short cropped hair so the tiny, low, "
        "grapefruit-sized braincase and the sharply sloping forehead are obvious, the skull small for the face. "
        "A rounded bony brow ridge juts out over the eyes. The jaws and teeth push forward into a short muzzle "
        "well in front of a very flat, broad nose with no bridge. A long upper lip, and the jaw slopes back with "
        "no chin. Short sparse beard. About 30, not elderly. Shoulders rolled forward, arms long with "
        "fingertips near the knees, legs visibly short, and very long flat feet, each about as long as the "
        "shin. "
    ) + ARCHAIC_TAIL,
    ("homo-floresiensis", "female"): (
        "No facial hair: smooth hairless chin and upper lip. About 30, few wrinkles. Hair tied back tight so "
        "the tiny low braincase and sharply sloping forehead show. Head turned almost to profile. A rounded "
        "bony brow ridge juts out. The jaws push forward into a short muzzle in front of a very flat, "
        "bridgeless, broad nose. A long upper lip and no chin. Shoulders rolled forward, fingertips near the "
        "knees, visibly short legs, very long flat feet. The same skull and body as the male, slightly "
        "smaller. "
    ) + ARCHAIC_TAIL,
    ("homo-habilis", "male"): (
        "Very short cropped hair so the small rounded braincase, clearly smaller than a modern head relative "
        "to the face, and the low forehead show. A flat nose with no bridge at all, nostrils facing forward. "
        "The jaws push forward into a short muzzle in front of the nose. Proportions check: legs short, no "
        "longer than the torso; arms long so the fingertips hang level with the knees. A light covering of "
        "short dark hair over chest, back, arms and legs. Head in three-quarter view. The face is closer to an "
        "australopith's than to a human's: the area between the eyes is flat and wide with no raised ridge "
        "running down to the nose, and in three-quarter view the mouth and jaws stick out further than the "
        "nose. "
    ) + ARCHAIC_TAIL,
    ("homo-habilis", "female"): (
        "Hair short or tied back tight so the small rounded braincase and low sloping forehead show. Head in "
        "three-quarter view. The jaws push well forward into a short muzzle in front of a flat, bridgeless "
        "nose with forward-facing nostrils. A long upper lip and no chin. Legs short, no longer than the "
        "torso; arms long with fingertips level with the knees. A visible light coat of short dark hair on "
        "arms, legs, shoulders and back. As archaic as the male: same skull, muzzle and nose, only slightly "
        "smaller. The face is closer to an australopith's than to a human's: the area between the eyes is flat "
        "and wide with no raised ridge running down to the nose. No facial hair, young smooth skin. "
    ) + ARCHAIC_TAIL,
    ("sahelanthropus-tchadensis", "male"): (
        "Head in three-quarter view. The brow ridge is a huge, continuous horizontal bony bar, as thick as two "
        "fingers, running straight across from temple to temple and jutting out so far that it forms a roof "
        "with the eyes in black shadow beneath it. This is the first thing anyone notices. Directly above it, "
        "the head drops back flat with no forehead. Small dark eyes with no white showing. A flat chimp nose: "
        "two wide nostrils, no bridge, no tip. A long flat face sloping down and forward below the brow. "
    ),
    ("sahelanthropus-tchadensis", "female"): (
        "Clothing check, most important: a thick, stiff, opaque hide wrap goes over the left shoulder and "
        "covers the whole chest from the collarbones to the waist on both sides, with no skin showing between "
        "the wrap edge and the armpits. It hangs straight and loose like a stiff box, with no shape of the body "
        "visible through it. No nipples or breast outline visible. Plus the brow fix: a huge continuous bony "
        "brow bar running temple to temple, jutting out like a roof with the eyes in deep shadow, and no "
        "forehead above it. A flat chimp nose with no bridge, and small dark eyes with no white showing. "
    ),
}

EXTRA_SKIN = {
    ("neanderthal", "female"): "Pale, freckled skin, not tanned. ",
    ("neanderthal", "male"): "Light olive, weathered skin, not deeply tanned. ",
}

FEMALE_MATCH = (
    "She is just as archaic as the males of her species: the same forehead, brow ridge, midface, jaw, nose "
    "and chin, only slightly smaller and without a beard; her face must not look like a modern woman's. "
)

EXPRESSIONS = {"female": "calm and patient", "male": "calm, mildly amused"}


def api_key():
    key = os.environ.get("OPENAI_API_KEY")
    if key:
        return key
    out = subprocess.run(
        ["powershell", "-NoProfile", "-Command",
         "[Environment]::GetEnvironmentVariable('OPENAI_API_KEY','User')"],
        capture_output=True, text=True,
    ).stdout.strip()
    if not out:
        sys.exit("OPENAI_API_KEY not found")
    return out


def request(req, timeout=300):
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            if e.code != 429 and e.code < 500:
                raise RuntimeError(f"HTTP {e.code}: {body}") from None
            err = f"HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError) as e:
            err = str(e)
        wait = 5 * 2 ** attempt
        print(f"  retry in {wait}s ({err})", flush=True)
        time.sleep(wait)
    raise RuntimeError("gave up after retries")


def pick_model(key):
    req = urllib.request.Request(f"{API}/models", headers={"Authorization": f"Bearer {key}"})
    ids = {m["id"] for m in request(req)["data"]}
    for preferred in ("gpt-image-2", "gpt-image-1.5", "gpt-image-1"):
        if preferred in ids:
            return preferred
    sys.exit("no gpt-image model available")


def multipart(fields, files):
    boundary = uuid.uuid4().hex
    buf = io.BytesIO()
    for name, value in fields.items():
        buf.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for name, path in files:
        buf.write(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{Path(path).name}"\r\n'
            f"Content-Type: image/png\r\n\r\n".encode()
        )
        buf.write(Path(path).read_bytes())
        buf.write(b"\r\n")
    buf.write(f"--{boundary}--\r\n".encode())
    return buf.getvalue(), f"multipart/form-data; boundary={boundary}"


def generate(api, prompt, out_path, refs=()):
    key, model = api
    fields = {"model": model, "prompt": prompt, "size": SIZE, "quality": QUALITY, "n": 1}
    if refs:
        body, ctype = multipart(fields, [("image[]", r) for r in refs])
        url = f"{API}/images/edits"
    else:
        body, ctype = json.dumps({**fields, "output_format": "png"}).encode(), "application/json"
        url = f"{API}/images/generations"
    req = urllib.request.Request(url, data=body, headers={"Authorization": f"Bearer {key}", "Content-Type": ctype})
    resp = request(req)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(resp["data"][0]["b64_json"]))
    usage = resp.get("usage", {})
    print(
        f"  saved {out_path.relative_to(ROOT)} input={usage.get('input_tokens', '?')} "
        f"output={usage.get('output_tokens', '?')}",
        flush=True,
    )
    return usage


def load_stages():
    if not STAGES_JSON.exists():
        sys.exit(f"{STAGES_JSON} not found")
    return sorted(json.loads(STAGES_JSON.read_text(encoding="utf-8")), key=lambda s: s["order"])


def subject(stages, stage_id):
    stage = next((s for s in stages if s["id"] == stage_id), None)
    if not stage:
        sys.exit(f"stage {stage_id} not in {STAGES_JSON.name}")
    return stage


def fix_text(stage_id, sex):
    face = EXTRA.get(stage_id)
    if not face:
        return ""
    return (
        EXTRA_SKIN.get((stage_id, sex), "") + face + EXTRA_SEX.get((stage_id, sex), "")
        + (FEMALE_MATCH if sex == "female" else "")
    )


def reference_text(same_species, sex):
    labels = ("The reference image",) if len(same_species) == 1 else REF_LABELS
    parts = []
    for i, (label, same) in enumerate(zip(labels, same_species)):
        if same:
            parts.append(REF_SAME_SPECIES.format(label=label, sex=sex, style=REF_STYLE_ALSO if i == 0 else ""))
        else:
            parts.append(REF_STYLE.format(label=label))
    return "".join(parts) + REFERENCE_INTRO


def build_prompt(style, subj, sex, same_species, extra):
    block, template = STYLES[style]
    anatomy = re.split(r"\s(?:Wears|Bare-chested)\b", subj["anatomy"][sex])[0]
    text = template.format(
        style=block,
        sex=sex,
        species=subj["species"],
        anatomy=anatomy.rstrip("."),
        clothing=CLOTHING[sex],
        expression=EXPRESSIONS[sex],
        fix=fix_text(subj["id"], sex) if style == "photo" else "",
    )
    if same_species:
        text = reference_text(same_species, sex) + text + REFERENCE_SUFFIX
    if extra:
        text += " " + extra
    hits = [w for w in BANNED if f" {w}" in f" {text.lower()}"]
    if hits:
        sys.exit(f"banned words in prompt: {hits}")
    return text


def to_webp(png_path, webp_path):
    img = Image.open(png_path).convert("RGB").resize((1024, 1536), Image.LANCZOS)
    webp_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(webp_path, "WEBP", quality=80, method=6)


def wanted(key, only):
    return not only or key in only


def log_prompt(path, key, prompt):
    log = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    log[key] = prompt
    path.write_text(json.dumps(log, indent=2), encoding="utf-8")


def references(anchor, anchor_stage, stage_id, sex, pair):
    refs, same = [anchor], [anchor_stage == stage_id]
    if sex == "female" and pair.exists() and pair.stem != anchor.stem:
        refs.append(pair)
        same.append(True)
    return refs, tuple(same)


def anchored_set(api, style, out_dir, prefix, subjects, only, extra):
    log = out_dir / "prompts.json"
    anchor_key = f"{prefix}{subjects[0]['id']}-male"
    anchor = out_dir / f"{anchor_key}.png"
    if wanted(anchor_key, only):
        print(f"[{anchor_key}] generations", flush=True)
        prompt = build_prompt(style, subjects[0], "male", (), extra)
        generate(api, prompt, anchor)
        log_prompt(log, anchor_key, prompt)
    for subj in subjects:
        for sex in SEXES:
            key = f"{prefix}{subj['id']}-{sex}"
            if key == anchor_key or not wanted(key, only):
                continue
            pair = out_dir / f"{prefix}{subj['id']}-male.png"
            refs, same = references(anchor, subjects[0]["id"], subj["id"], sex, pair)
            print(f"[{key}] edits with {len(refs)} reference(s)", flush=True)
            prompt = build_prompt(style, subj, sex, same, extra)
            generate(api, prompt, out_dir / f"{key}.png", refs)
            log_prompt(log, key, prompt)


def contact_sheet(out_dir, rows, subjects):
    if not out_dir.exists():
        return
    cols = [(s, sex) for s in subjects for sex in ("male", "female")]
    tile_w, tile_h, label_h, left = 320, 480, 44, 170
    sheet = Image.new("RGB", (left + tile_w * len(cols), label_h + (tile_h + 8) * len(rows)), (24, 20, 18))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    for c, (subj, sex) in enumerate(cols):
        name = subj["species"]
        if " " in name:
            genus, rest = name.split(" ", 1)
            name = f"{genus[0]}. {rest}"
        draw.text((left + c * tile_w + 10, 10), f"{name} {sex}", fill=(236, 226, 205), font=font)
    for r, (label, prefix) in enumerate(rows):
        y = label_h + r * (tile_h + 8)
        draw.text((10, y + tile_h // 2 - 12), label, fill=(236, 226, 205), font=font)
        for c, (subj, sex) in enumerate(cols):
            path = out_dir / f"{prefix}{subj['id']}-{sex}.png"
            if path.exists():
                img = Image.open(path).convert("RGB").resize((tile_w - 8, tile_h), Image.LANCZOS)
                sheet.paste(img, (left + c * tile_w, y))
    out = out_dir / "contact-sheet.png"
    sheet.save(out)
    print(f"contact sheet {out.relative_to(ROOT)}")


def style_sheet(stages):
    contact_sheet(STYLE_TEST_DIR, [("A: picture day", "A-"), ("B: oil portrait", "B-")],
                  [subject(stages, s) for s in TEST_STAGES])


def full_body_sheet(stages):
    contact_sheet(FULL_BODY_DIR, [("B: full length", "")], [subject(stages, s) for s in TEST_STAGES])


def photo_sheet(stages):
    contact_sheet(PHOTO_DIR, [("photo: studio", "")], [subject(stages, s) for s in TEST_STAGES])


def full_sheet(stages):
    tile_w, tile_h, label_h, left = 200, 300, 32, 260
    sheet = Image.new("RGB", (left + tile_w * len(SEXES), label_h + tile_h * len(stages)), (24, 20, 18))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    for c, sex in enumerate(SEXES):
        draw.text((left + c * tile_w + 10, 7), sex, fill=(236, 226, 205), font=font)
    for r, stage in enumerate(stages):
        y = label_h + r * tile_h
        draw.text((10, y + tile_h // 2 - 10), stage["species"], fill=(236, 226, 205), font=font)
        for c, sex in enumerate(SEXES):
            path = ALL_RAW_DIR / f"{stage['id']}-{sex}.png"
            if path.exists():
                img = Image.open(path).convert("RGB").resize((tile_w - 6, tile_h - 6), Image.LANCZOS)
                sheet.paste(img, (left + c * tile_w, y))
    out = ALL_RAW_DIR / "contact-sheet.png"
    sheet.save(out)
    print(f"contact sheet {out.relative_to(ROOT)}")


def generate_all(api, style, anchor, only, extra):
    stages = load_stages()
    anchor_stage = anchor.stem.rsplit("-", 1)[0]
    log = ALL_RAW_DIR / "prompts.json"
    ALL_RAW_DIR.mkdir(parents=True, exist_ok=True)
    for stage in stages:
        for sex in SEXES:
            key = f"{stage['id']}-{sex}"
            if not wanted(key, only):
                continue
            raw = ALL_RAW_DIR / f"{key}.png"
            if key == anchor.stem:
                shutil.copyfile(anchor, raw)
                to_webp(raw, PORTRAITS_DIR / f"{key}.webp")
                print(f"[{key}] copied from anchor", flush=True)
                continue
            refs, same = references(anchor, anchor_stage, stage["id"], sex, ALL_RAW_DIR / f"{stage['id']}-male.png")
            print(f"[{key}] edits with {len(refs)} reference(s)", flush=True)
            prompt = build_prompt(style, stage, sex, same, extra)
            generate(api, prompt, raw, refs)
            log_prompt(log, key, prompt)
            to_webp(raw, PORTRAITS_DIR / f"{key}.webp")
    full_sheet(stages)


def main():
    p = argparse.ArgumentParser(description="Generate hominin portraits with the OpenAI Images API")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--style-test", action="store_true")
    mode.add_argument("--full-body-test", action="store_true")
    mode.add_argument("--photo-test", action="store_true")
    mode.add_argument("--all", action="store_true")
    mode.add_argument("--contact-sheet", action="store_true")
    p.add_argument("--style", choices=sorted(STYLES))
    p.add_argument("--anchor", type=Path, default=PHOTO_DIR / "neanderthal-male.png")
    p.add_argument("--only", default="", help="comma-separated keys, e.g. neanderthal-female or B-neanderthal-male")
    p.add_argument("--extra", default="", help="text appended to every prompt in this run")
    p.add_argument("--model", help="override the auto-picked model")
    args = p.parse_args()
    only = {k.strip() for k in args.only.split(",") if k.strip()}
    stages = load_stages()

    if args.contact_sheet:
        style_sheet(stages)
        full_body_sheet(stages)
        photo_sheet(stages)
        full_sheet(stages)
        return

    if args.all and not args.anchor.exists():
        sys.exit(f"--all needs an existing --anchor image ({args.anchor})")
    key = api_key()
    api = (key, args.model or pick_model(key))
    print(f"model {api[1]}", flush=True)
    subjects = [subject(stages, s) for s in TEST_STAGES]
    if args.style_test:
        for style in [args.style] if args.style in ("A", "B") else ["A", "B"]:
            anchored_set(api, style, STYLE_TEST_DIR, f"{style}-", subjects, only, args.extra)
        style_sheet(stages)
    elif args.full_body_test:
        anchored_set(api, "B", FULL_BODY_DIR, "", subjects, only, args.extra)
        full_body_sheet(stages)
    elif args.photo_test:
        anchored_set(api, "photo", PHOTO_DIR, "", subjects, only, args.extra)
        photo_sheet(stages)
    else:
        generate_all(api, args.style or "photo", args.anchor, only, args.extra)


if __name__ == "__main__":
    main()
