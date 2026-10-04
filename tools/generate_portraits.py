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

REF_LABELS = ("The first reference image", "The second reference image", "The third reference image")

REF_STYLE = (
    "{label} shows a different individual of a different species. Use it only as the reference for "
    "photographic style, studio backdrop, lighting, colour grade, framing and rendering. Do not copy its "
    "anatomy, face, skull, body proportions, skin colour, hair or clothing. "
)

REF_SAME_SPECIES = (
    "{label} shows another individual of the same species as the new portrait.{style} Use it as the "
    "reference for species anatomy: give the new individual the same skull, forehead, brow ridge, midface, "
    "nose, jaw and chin shapes, the same limb proportions and the same amount of body hair, adapted to a "
    "{sex}, as a clearly different person. Do not copy its skin colour, skin texture, hair colour, facial hair, "
    "clothing or pose. "
)

REF_FACE = (
    "{label} shows an individual of a related extinct species, {donor}.{style} Use it as the reference "
    "for the shape of the face and head only: take its low sloping forehead, long low skull, brow ridge, low flat "
    "nose, forward-pushed jaws and chinless jaw line, so the new face is at least as archaic as this one "
    "and reads as an extinct species, never as a living person. Keep the new individual's own build, "
    "height, limb proportions, skin colour, hair and body hair exactly as described below. Do not copy its "
    "skin colour, skin texture, facial hair, body hair, clothing or pose. "
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
        "a very broad, tall, flat face with wide cheekbones; a very wide, low, flat nose; a long upper lip over a "
        "wide mouth; a huge, deep jaw pushed forward with very large teeth and a receding chin with no chin "
        "point. "
    ),
    "homo-heidelbergensis": ARCHAIC_LEAD + (
        "A long, low skull with a low forehead sloping straight back from the brow; a very large, thick, "
        "double-arched brow ridge forming a heavy bony bar jutting out over deep-set eyes; a long, broad face "
        "with the midface pushed forward around a very wide, low, flat nose; a long upper lip; a massive, deep "
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

HEAD_HAIR = {
    "male": "Head hair cropped very short, close to the scalp",
    "female": "Head hair cropped very short, close to the scalp like the male's, with no knot, bun or ponytail",
}

YOUNG_FEMALE = "About 30, smooth skin, no wrinkles, no facial hair. "

ARCHAIC_NEUTRAL = (
    "A neutral face with the mouth closed, no smile. A smooth forehead with no horizontal wrinkles and no "
    "crow's feet. "
)

BARE_FEMALE_FACE = (
    "Completely hairless face below the brow: no stubble, no whiskers, no bristles on chin, jaw, cheeks or "
    "upper lip, and no beard shadow: jaw, cheeks and upper lip are bare skin the same colour as the forehead. "
    "Smooth, natural, even skin texture, no cracked or crazed pattern. Body "
    "hair stops at the neck. "
)

ARCHAIC_HAIR = (
    "Short, thick, dark, untidy hair swept straight back off the forehead and temples, not a buzz cut or any "
    "modern hairstyle"
)

YOUNG_SKIN = (
    "All bare skin on the face, neck, shoulders, chest, arms and legs is soft, smooth and even like a "
    "healthy young adult's, matte rather than shiny, with fine natural pores only and no pattern of lines "
    "on it. "
)

ARCHAIC_SHADE = (
    "The softbox key light sits high above the face, so the jutting brow bar throws both eye sockets into "
    "solid shadow and only a glint of each eye shows. The nose is short, broad and flat, low between the "
    "cheeks, nostrils facing forward, no rounded fleshy tip; in profile it barely sticks out past the upper "
    "lip, and the mouth sticks out further than the nose. "
)


def smooth_skin(areas):
    return (
        f"Skin on the {areas} is smooth, even and supple like a young person's, with fine pores only: no "
        "crackle, crazing, scales, cell pattern, polygon lines or dry-clay texture, and no grid of creases. "
        "Body hair is fine, short and lies flat on the skin, with no fuzzy halo around the outline. "
    )


def archaic_head(fossil, sex, turn="about 45 degrees", hair=None):
    return (
        f"Head check, most important: the head looks like a museum reconstruction built on the {fossil}, an "
        f"extinct species, not any living person. {hair or HEAD_HAIR[sex]}, so the low sloping forehead, the long low "
        "skull and the whole brow ridge are fully visible, with no hair on the forehead or temples. The whole "
        f"head is turned {turn} to the side, the face in three-quarter profile with the nose pointing "
        "past the camera, not facing it, so the forward projection of the brow, midface and jaws shows in "
        "silhouette against the backdrop. The brow ridge juts out far enough to "
        "cast a band of shadow over the eyes. The nose is low and flat with no tall bridge, and the area "
        "between the eyes is flat. No chin: the jaw line slopes straight back from the lower lip. "
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
    ("denisovan", "female"): archaic_head("Harbin skull", "female", hair=ARCHAIC_HAIR) + (
        "A woman of about 30, smaller and finer-boned than the Denisovan male, clearly female in face shape, "
        "and younger than the male reference. Completely hairless face: jaw, chin, cheeks and upper lip are "
        "bare skin the same tone as the forehead, no stubble or shadow; no forehead lines, eye bags or "
        "nasolabial folds. Museum reconstruction from the Harbin skull: a very wide face with a long low skull; "
        "a thick, straight brow bar with both eyes deep in its shadow; the forehead slopes straight back from "
        "the brow at 45 degrees; the nose root is flat and sunk level with the inner eye corners, no bridge, "
        "very wide flat nostrils; the upper jaw and thin lips push forward past the nose base; very large "
        "molars widen the lower face; no chin bump. "
    ) + ARCHAIC_SHADE + ARCHAIC_NEUTRAL + YOUNG_SKIN + ARCHAIC_TAIL,
    ("homo-heidelbergensis", "male"): archaic_head(
        "Kabwe 1 skull", "male", hair=ARCHAIC_HAIR + ", and a short trimmed dark beard with no grey",
    ) + (
        "A museum bust of the Kabwe 1 skull, not a living man: a thick bony brow bar sticking out 2 cm past "
        "the eyes, both eye sockets in solid shadow with only a glint of each eye; behind the brow the forehead "
        "runs straight back at 45 degrees with no vertical part; the nose root sits sunk level with the inner "
        "eye corners, no raised bridge, nostrils wide and flat with no rounded tip; the upper jaw and lips "
        "bulge forward a full finger-width past the nose base, like a Neanderthal's midface but longer. About "
        "35, no crow's feet, no forehead lines. "
    ) + ARCHAIC_SHADE + ARCHAIC_NEUTRAL + YOUNG_SKIN + ARCHAIC_TAIL,
    ("homo-heidelbergensis", "female"): archaic_head("Kabwe 1 skull", "female", hair=ARCHAIC_HAIR) + (
        "Clearly a woman of about 30, softer and smaller than the male, with a narrower face and smaller jaw, "
        "and younger than the male reference. Completely hairless face: the jaw, chin, cheeks and upper lip "
        "are bare smooth skin the same colour as her forehead, no stubble or shadow; no forehead lines, no "
        "crow's feet, no nasolabial folds. Archaic museum reconstruction of a female Kabwe/Petralona skull: a "
        "thick brow bar that puts both eyes in shadow, forehead ramping back at 45 degrees, nose root sunk flat "
        "between the eyes with no raised bridge, the mouth and upper jaw bulging forward past the nose, no "
        "chin. The hide top is thick, stiff leather-backed hide lying flat over the chest with no outline of "
        "the body showing through. "
    ) + ARCHAIC_SHADE + ARCHAIC_NEUTRAL + YOUNG_SKIN + ARCHAIC_TAIL,
    ("homo-floresiensis", "male"): archaic_head("LB1 skull from Liang Bua", "male") + (
        "A tiny, low, grapefruit-sized braincase, small for the face. A rounded bony brow ridge. The jaws "
        "and teeth push forward into a short muzzle well in front of the nose, like an australopith's. A long "
        "upper lip. Short sparse beard trimmed close. About 30, with only light lines around the eyes. "
        "Shoulders rolled forward, arms long with fingertips near the knees, legs visibly short, and very long "
        "flat feet. "
    ) + smooth_skin("chest, belly, arms and legs") + ARCHAIC_TAIL,
    ("homo-floresiensis", "female"): archaic_head("LB1 skull from Liang Bua", "female") + (
        "A tiny, low, grapefruit-sized braincase, small for the face. A rounded bony brow ridge. The jaws "
        "and teeth push forward into a short muzzle well in front of the nose, like an australopith's. A long "
        "upper lip. Shoulders rolled forward, arms long with fingertips near the knees, legs visibly short, "
        "and very long flat feet. The same skull and body as the male, slightly smaller. Keep this face shape "
        "and skull exactly. "
    ) + BARE_FEMALE_FACE + smooth_skin("shoulders, arms, neck and legs") + YOUNG_FEMALE + ARCHAIC_TAIL,
    ("homo-habilis", "male"): archaic_head("KNM-ER 1813 skull", "male") + (
        "The braincase is visibly small and rounded, clearly smaller than Homo erectus's, so the face looks "
        "large for the head. The face is closer to an australopith's than to a human's: the jaws push well "
        "forward into a short muzzle in front of the nose, the nostrils face forward, and the area between the "
        "eyes is flat and wide. A long upper lip. Legs short, no longer than the torso; arms long so the "
        "fingertips hang level with the knees. A light coat of fine, short dark hair over chest, back, arms "
        "and legs. "
    ) + smooth_skin("chest, belly, arms and legs") + ARCHAIC_TAIL,
    ("homo-habilis", "female"): archaic_head("KNM-ER 1813 skull", "female") + (
        "The braincase is visibly small and rounded, clearly smaller than Homo erectus's, so the face looks "
        "large for the head. The face is closer to an australopith's than to a human's: the jaws push well "
        "forward into a short muzzle in front of the nose, the nostrils face forward, and the area between the "
        "eyes is flat and wide. A long upper lip. Legs short, no longer than the torso; arms long so the "
        "fingertips hang level with the knees. Body hair is fine, short and sparse on arms, legs, shoulders "
        "and back only, stopping at the neck. As archaic as the male, only slightly smaller: keep the "
        "australopith-like muzzle of the reference images, the mouth and jaws sticking out well past the nose "
        "in profile. Only the skin is young and smooth; the face shape stays archaic. "
    ) + BARE_FEMALE_FACE + smooth_skin("neck, chest, shoulders, arms and legs") + YOUNG_FEMALE + ARCHAIC_TAIL,
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

FACE_DONOR = {
    ("homo-heidelbergensis", "male"): "homo-erectus-male",
    ("homo-heidelbergensis", "female"): "homo-erectus-male",
    ("denisovan", "female"): "homo-erectus-male",
    ("homo-floresiensis", "male"): "australopithecus-afarensis-male",
    ("homo-habilis", "male"): "australopithecus-afarensis-male",
    ("homo-habilis", "female"): "australopithecus-afarensis-female",
}

KEY_MODEL = {
    "homo-heidelbergensis-male": "gpt-image-2.5-flare",
    "homo-heidelbergensis-female": "gpt-image-2.5-flare",
    "denisovan-female": "gpt-image-2.5-flare",
}

RETOUCH_PROMPT = (
    "Retouch this exact photograph. Keep the figure, pose, face shape, skull, muzzle, brow, nose, jaw, head "
    "hair, clothing, body proportions, backdrop and its brightness, lighting, framing and colour exactly as "
    "they are, and change only what is described here: "
)

RETOUCH = {
    "homo-floresiensis-female": (
        "Make her about 30: a smooth, unlined face with no crow's feet, no under-eye wrinkles, no forehead or "
        "cheek lines. The chin, jaw, cheeks and upper lip are bare smooth skin the same colour as her "
        "forehead, with no whiskers, no bristles, no stubble dots. No stray hairs standing out along the "
        "outline of the face, neck, shoulders or arms. Smooth away every fine drawn line on the forehead, "
        "cheeks, neck, shoulders and arms. "
    ) + YOUNG_SKIN,
    "homo-habilis-female": (
        "Make her about 30 with a smooth, unlined face: no crow's feet, no under-eye or cheek wrinkles. The "
        "upper lip, chin, jaw and cheeks are completely hairless bare skin the same tone as the forehead, with "
        "no whiskers, bristles or stubble. No stray hairs standing out along the outline of the face, neck, "
        "shoulders or arms. Make the brow ridge a little heavier so the upper eyelids sit in shadow. "
    ) + YOUNG_SKIN,
}

EXTRA_SKIN = {
    ("neanderthal", "female"): "Pale, freckled skin, not tanned. ",
    ("neanderthal", "male"): "Light olive, weathered skin, not deeply tanned. ",
}

FEMALE_MATCH = (
    "She is just as archaic as the males of her species: the same forehead, brow ridge, midface, jaw, nose "
    "and chin, only slightly smaller and without a beard; her face must not look like a modern woman's. "
)

EXPRESSIONS = {
    "female": "calm and patient",
    "male": "calm, mildly amused",
    ("homo-heidelbergensis", "male"): "neutral, no smile",
    ("homo-heidelbergensis", "female"): "neutral, no smile",
    ("denisovan", "female"): "neutral, no smile",
}


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
            if (e.code != 429 and e.code < 500) or "insufficient_quota" in body:
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


def reference_text(roles, sex):
    labels = ("The reference image",) if len(roles) == 1 else REF_LABELS
    parts = []
    for i, (label, role) in enumerate(zip(labels, roles)):
        if role == "same":
            parts.append(REF_SAME_SPECIES.format(label=label, sex=sex, style=REF_STYLE_ALSO if i == 0 else ""))
        elif role == "style":
            parts.append(REF_STYLE.format(label=label))
        else:
            parts.append(REF_FACE.format(label=label, donor=role, style=REF_STYLE_ALSO if i == 0 else ""))
    return "".join(parts) + REFERENCE_INTRO


def build_prompt(style, subj, sex, roles, extra):
    block, template = STYLES[style]
    anatomy = re.split(r"\s(?:Wears|Bare-chested)\b", subj["anatomy"][sex])[0]
    text = template.format(
        style=block,
        sex=sex,
        species=subj["species"],
        anatomy=anatomy.rstrip("."),
        clothing=CLOTHING[sex],
        expression=EXPRESSIONS.get((subj["id"], sex), EXPRESSIONS[sex]),
        fix=fix_text(subj["id"], sex) if style == "photo" else "",
    )
    if roles:
        text = reference_text(roles, sex) + text + REFERENCE_SUFFIX
    if extra:
        text += " " + extra
    return check_banned(text)


def check_banned(text):
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


def references(anchor, anchor_stage, stage_id, sex, pair, stages=()):
    refs, roles = [anchor], ["same" if anchor_stage == stage_id else "style"]
    donor = FACE_DONOR.get((stage_id, sex))
    if donor:
        species = subject(stages, donor.rsplit("-", 1)[0])["species"]
        if donor == anchor.stem:
            roles[0] = species
        else:
            refs.append(pair.parent / f"{donor}.png")
            roles.append(species)
    if sex == "female" and pair.exists() and pair.stem != anchor.stem:
        refs.append(pair)
        roles.append("same")
    return refs, tuple(roles)


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
            refs, roles = references(anchor, subjects[0]["id"], subj["id"], sex, pair)
            print(f"[{key}] edits with {len(refs)} reference(s)", flush=True)
            prompt = build_prompt(style, subj, sex, roles, extra)
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


def generate_all(api, style, anchor, only, extra, key_model):
    stages = load_stages()
    anchor_stage = anchor.stem.rsplit("-", 1)[0]
    log = ALL_RAW_DIR / "prompts.json"
    ALL_RAW_DIR.mkdir(parents=True, exist_ok=True)
    donor_users = {stage_id for stage_id, _ in FACE_DONOR}
    for stage in sorted(stages, key=lambda s: s["id"] in donor_users):
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
            refs, roles = references(
                anchor, anchor_stage, stage["id"], sex, ALL_RAW_DIR / f"{stage['id']}-male.png", stages
            )
            model = key_model.get(key, api[1])
            print(f"[{key}] edits with {len(refs)} reference(s), {model}", flush=True)
            prompt = build_prompt(style, stage, sex, roles, extra)
            generate((api[0], model), prompt, raw, refs)
            log_prompt(log, key, prompt)
            to_webp(raw, PORTRAITS_DIR / f"{key}.webp")
    full_sheet(stages)


def retouch_all(api, only, key_model):
    log = ALL_RAW_DIR / "prompts.json"
    for key in sorted(only):
        if key not in RETOUCH:
            sys.exit(f"no RETOUCH entry for {key}")
        raw = ALL_RAW_DIR / f"{key}.png"
        model = key_model.get(key, api[1])
        print(f"[{key}] retouch, {model}", flush=True)
        prompt = check_banned(RETOUCH_PROMPT + RETOUCH[key])
        generate((api[0], model), prompt, raw, [raw])
        log_prompt(log, key, prompt)
        to_webp(raw, PORTRAITS_DIR / f"{key}.webp")
    full_sheet(load_stages())


def main():
    p = argparse.ArgumentParser(description="Generate hominin portraits with the OpenAI Images API")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--style-test", action="store_true")
    mode.add_argument("--full-body-test", action="store_true")
    mode.add_argument("--photo-test", action="store_true")
    mode.add_argument("--all", action="store_true")
    mode.add_argument("--contact-sheet", action="store_true")
    mode.add_argument("--retouch", action="store_true", help="edit the --only keys' own images with RETOUCH")
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
    elif args.retouch:
        retouch_all(api, only, {} if args.model else KEY_MODEL)
    else:
        generate_all(api, args.style or "photo", args.anchor, only, args.extra, {} if args.model else KEY_MODEL)


if __name__ == "__main__":
    main()
