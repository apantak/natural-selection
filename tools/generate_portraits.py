import argparse
import base64
import io
import json
import os
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
ALL_RAW_DIR = OUT_DIR / "all"
API = "https://api.openai.com/v1"
SIZE = "1024x1536"
QUALITY = "medium"
SEXES = ("female", "male")

STYLES = {
    "A": (
        "1990s school picture-day portrait photograph, mottled blue laser-swirl studio backdrop, "
        "soft frontal key light, slight film grain, photographic, natural skin texture"
    ),
    "B": (
        "formal 17th-century oil portrait painting, dark umber background, warm Rembrandt lighting "
        "on the face, visible brushwork, aged varnish"
    ),
}

TEMPLATE = (
    "{style}. Chest-up portrait, three-quarter view, head fills the upper 55% of a 4:5 frame, eyes at "
    "the upper third, centred, plain backdrop. Subject: an adult {sex} {species}, about 30 years old, an "
    "ordinary unretouched individual, scientifically based on current museum reconstructions. "
    "Anatomy: {anatomy}. Wearing {garment} that fully covers the chest and shoulders, high at the neck. "
    "Expression: {expression}, mouth closed, dignified. Natural proportions, no makeup, no jewellery, "
    "no modern items."
)

REFERENCE_PREFIX = (
    "The reference image shows a different individual of a different species. Use it only as the "
    "reference for art style, lighting, colour grade, backdrop, framing and rendering. Create a new "
    "portrait of a new individual: "
)

REFERENCE_SUFFIX = " Match the lighting, colour grade, framing and rendering of the reference images exactly."

BANNED = ("smash", "sexy", "attractive", "nude", "naked", "hot", "beautiful", "race", "ethnic")

DEFAULT_GARMENT = "a simple, roughly stitched animal-hide wrap"

EXPRESSIONS = {"female": "calm and patient", "male": "calm, mildly amused"}

FALLBACK = {
    "neanderthal": {
        "species": "Neanderthal (Homo neanderthalensis)",
        "garment": "a thick, roughly stitched fur-lined animal-hide wrap",
        "anatomy": {
            "female": (
                "short, stocky, very muscular build about 155 cm tall with a broad barrel chest; long, low "
                "skull with a low receding forehead; a pronounced rounded double-arched brow ridge; large "
                "forward-projecting midface with swept-back angled cheekbones; a very large, wide nose; "
                "weak, receding chin; light skin with freckles and straight auburn-red hair tied back "
                "(genetic studies suggest some Neanderthals had pale skin and red hair)"
            ),
            "male": (
                "short, stocky, very muscular build about 165 cm tall with a broad barrel chest and thick "
                "neck; long, low skull with a low receding forehead; a heavy rounded double-arched brow "
                "ridge; large forward-projecting midface with swept-back angled cheekbones; a very large, "
                "wide nose; weak, receding chin hidden by a short beard; light olive skin, weathered, with "
                "dark brown hair and beard"
            ),
        },
    },
    "australopithecus-afarensis": {
        "species": "Australopithecus afarensis, an early upright-walking hominin",
        "garment": "a simple draped wrap of soft woven grass and hide",
        "anatomy": {
            "female": (
                "facial skin is pale beige with a pink tint, lighter than the reference image, because early "
                "hominins likely had light skin under their body hair; a museum reconstruction of the "
                "'Lucy' species, small, about 105 cm tall and slight; a small head with a small rounded "
                "braincase about one third the size of a modern human's and a low sloping skull, so almost "
                "no forehead rises above the brow ridge; the mouth and jaws protrude well forward of the "
                "nose, much more than in any human, with no chin; a flat, broad nose; facial proportions "
                "closer to a chimpanzee's than a modern human's, with upright posture; short dark brown "
                "hair over the head, neck and body, sparser on the face"
            ),
            "male": (
                "about 151 cm tall with long strong arms and broad shoulders; small rounded braincase about "
                "one third the size of a modern human's with a small low crest along the top; low, flat "
                "forehead and a moderate brow ridge; strongly projecting lower face and jaw (prognathism) "
                "with a flat nose and small canine teeth; dense reddish-brown hair over the head, neck and "
                "body, sparser on the face; medium brown facial skin; intelligent, attentive eyes"
            ),
        },
    },
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


KEY = api_key()


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


def pick_model():
    req = urllib.request.Request(f"{API}/models", headers={"Authorization": f"Bearer {KEY}"})
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


def generate(model, prompt, out_path, refs=()):
    fields = {"model": model, "prompt": prompt, "size": SIZE, "quality": QUALITY, "n": 1}
    if refs:
        body, ctype = multipart(fields, [("image[]", r) for r in refs])
        url = f"{API}/images/edits"
    else:
        body, ctype = json.dumps({**fields, "output_format": "png"}).encode(), "application/json"
        url = f"{API}/images/generations"
    req = urllib.request.Request(url, data=body, headers={"Authorization": f"Bearer {KEY}", "Content-Type": ctype})
    resp = request(req)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(resp["data"][0]["b64_json"]))
    usage = resp.get("usage", {})
    print(f"  saved {out_path.relative_to(ROOT)} tokens={usage.get('total_tokens', '?')}", flush=True)
    return usage


def load_stages():
    if not STAGES_JSON.exists():
        return []
    return sorted(json.loads(STAGES_JSON.read_text(encoding="utf-8")), key=lambda s: s["order"])


def find_stage(stages, key):
    word = key.split("-")[-1]
    for s in stages:
        if word in s["species"].lower() or word in s["id"].lower():
            return s
    return None


def subject(stage_key, stages):
    stage = find_stage(stages, stage_key)
    fallback = FALLBACK.get(stage_key, {})
    if stage and stage.get("anatomy", {}).get("female"):
        return {
            "id": stage["id"],
            "species": stage["species"],
            "garment": fallback.get("garment", DEFAULT_GARMENT),
            "anatomy": stage["anatomy"],
        }
    return {"id": stage_key, **fallback}


def build_prompt(style, subj, sex, with_refs, extra):
    text = TEMPLATE.format(
        style=STYLES[style],
        sex=sex,
        species=subj["species"],
        anatomy=subj["anatomy"][sex].rstrip("."),
        garment=subj.get("garment", DEFAULT_GARMENT),
        expression=EXPRESSIONS[sex],
    )
    if with_refs:
        text = REFERENCE_PREFIX + text + REFERENCE_SUFFIX
    if extra:
        text += " " + extra
    hits = [w for w in BANNED if f" {w}" in f" {text.lower()}"]
    if hits:
        sys.exit(f"banned words in prompt: {hits}")
    return text


def to_webp(png_path, webp_path):
    img = Image.open(png_path).convert("RGB")
    w, h = img.size
    target_h = round(w * 5 / 4)
    top = (h - target_h) // 2
    img = img.crop((0, top, w, top + target_h)).resize((1024, 1280), Image.LANCZOS)
    webp_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(webp_path, "WEBP", quality=85, method=6)


def wanted(key, only):
    return not only or key in only


def log_prompt(path, key, prompt):
    log = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    log[key] = prompt
    path.write_text(json.dumps(log, indent=2), encoding="utf-8")


def style_test(model, styles, only, extra):
    stages = load_stages()
    subjects = [subject("neanderthal", stages), subject("australopithecus-afarensis", stages)]
    log = STYLE_TEST_DIR / "prompts.json"
    for style in styles:
        anchor_subj = subjects[0]
        anchor = STYLE_TEST_DIR / f"{style}-{anchor_subj['id']}-male.png"
        anchor_key = f"{style}-{anchor_subj['id']}-male"
        if wanted(anchor_key, only):
            print(f"[{anchor_key}] generations", flush=True)
            prompt = build_prompt(style, anchor_subj, "male", False, extra)
            generate(model, prompt, anchor)
            log_prompt(log, anchor_key, prompt)
        for subj in subjects:
            for sex in SEXES:
                key = f"{style}-{subj['id']}-{sex}"
                if key == anchor_key or not wanted(key, only):
                    continue
                print(f"[{key}] edits with anchor", flush=True)
                prompt = build_prompt(style, subj, sex, True, extra)
                generate(model, prompt, STYLE_TEST_DIR / f"{key}.png", [anchor])
                log_prompt(log, key, prompt)
    contact_sheet(styles=("A", "B"), subjects=subjects)


def contact_sheet(styles, subjects):
    cols = [(s, sex) for s in subjects for sex in ("male", "female")]
    tile_w, tile_h, label_h, left = 320, 400, 44, 150
    sheet = Image.new("RGB", (left + tile_w * len(cols), label_h + (tile_h + 8) * len(styles)), (24, 20, 18))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    names = {"A": "A: picture day", "B": "B: oil portrait"}
    for c, (subj, sex) in enumerate(cols):
        name = subj["species"].split(" (")[0].split(",")[0]
        if " " in name:
            genus, rest = name.split(" ", 1)
            name = f"{genus[0]}. {rest}"
        draw.text((left + c * tile_w + 10, 10), f"{name} {sex}", fill=(236, 226, 205), font=font)
    for r, style in enumerate(styles):
        y = label_h + r * (tile_h + 8)
        draw.text((10, y + tile_h // 2 - 12), names[style], fill=(236, 226, 205), font=font)
        for c, (subj, sex) in enumerate(cols):
            path = STYLE_TEST_DIR / f"{style}-{subj['id']}-{sex}.png"
            if path.exists():
                img = Image.open(path).convert("RGB")
                w, h = img.size
                th = round(w * 5 / 4)
                img = img.crop((0, (h - th) // 2, w, (h - th) // 2 + th)).resize((tile_w - 8, tile_h), Image.LANCZOS)
                sheet.paste(img, (left + c * tile_w, y))
    out = STYLE_TEST_DIR / "contact-sheet.png"
    sheet.save(out)
    print(f"contact sheet {out.relative_to(ROOT)}")


def generate_all(model, style, anchor, only, extra):
    stages = load_stages()
    if not stages:
        sys.exit(f"{STAGES_JSON} not found")
    log = ALL_RAW_DIR / "prompts.json"
    ALL_RAW_DIR.mkdir(parents=True, exist_ok=True)
    for stage in stages:
        subj = {
            "id": stage["id"],
            "species": stage["species"],
            "garment": FALLBACK.get(stage["id"], {}).get("garment", DEFAULT_GARMENT),
            "anatomy": stage["anatomy"],
        }
        refs = [anchor]
        for sex in SEXES:
            key = f"{stage['id']}-{sex}"
            raw = ALL_RAW_DIR / f"{key}.png"
            if wanted(key, only):
                print(f"[{key}] edits with {len(refs)} reference(s)", flush=True)
                prompt = build_prompt(style, subj, sex, True, extra)
                generate(model, prompt, raw, refs)
                log_prompt(log, key, prompt)
                to_webp(raw, PORTRAITS_DIR / f"{key}.webp")
            if raw.exists():
                refs = [anchor, raw]


def main():
    p = argparse.ArgumentParser(description="Generate hominin portraits with the OpenAI Images API")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--style-test", action="store_true")
    mode.add_argument("--all", action="store_true")
    mode.add_argument("--contact-sheet", action="store_true")
    p.add_argument("--style", choices=sorted(STYLES))
    p.add_argument("--anchor", type=Path)
    p.add_argument("--only", default="", help="comma-separated keys, e.g. A-neanderthal-female or neanderthal-male")
    p.add_argument("--extra", default="", help="text appended to every prompt in this run")
    p.add_argument("--model", help="override the auto-picked model")
    args = p.parse_args()
    only = {k.strip() for k in args.only.split(",") if k.strip()}

    if args.contact_sheet:
        stages = load_stages()
        contact_sheet(("A", "B"), [subject("neanderthal", stages), subject("australopithecus-afarensis", stages)])
        return

    if args.all and (not args.style or not args.anchor or not args.anchor.exists()):
        sys.exit("--all needs --style and an existing --anchor image")
    model = args.model or pick_model()
    print(f"model {model}", flush=True)
    if args.style_test:
        style_test(model, [args.style] if args.style else ["A", "B"], only, args.extra)
    else:
        generate_all(model, args.style, args.anchor, only, args.extra)


if __name__ == "__main__":
    main()
