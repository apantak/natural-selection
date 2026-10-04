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
FULL_BODY_DIR = OUT_DIR / "full-body-test"
ALL_RAW_DIR = OUT_DIR / "all"
API = "https://api.openai.com/v1"
SIZE = "1024x1536"
QUALITY = "medium"
SEXES = ("female", "male")
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

STYLES = {
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
        "minimal period clothing; a simple hide wrap that fully covers her chest, and a hide loincloth "
        "that fully covers the groin; arms, shoulders and legs bare"
    ),
    "male": "minimal period clothing; a hide loincloth that fully covers the groin; arms and legs bare",
}

REFERENCE_PREFIX = (
    "The reference image shows a different individual of a different species. Use it only as the "
    "reference for art style, lighting, colour grade, backdrop, framing and rendering. Do not copy its "
    "skin colour, hair colour, body shape or clothing. Create a new portrait of a new individual: "
)

REFERENCE_SUFFIX = " Match the lighting, colour grade, framing and rendering of the reference images exactly."

BANNED = ("smash", "sexy", "attractive", "nude", "naked", "hot", "beautiful", "race", "ethnic")

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


def build_prompt(style, subj, sex, with_refs, extra):
    block, template = STYLES[style]
    text = template.format(
        style=block,
        sex=sex,
        species=subj["species"],
        anatomy=subj["anatomy"][sex].rstrip("."),
        clothing=CLOTHING[sex],
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
    img = Image.open(png_path).convert("RGB").resize((1024, 1536), Image.LANCZOS)
    webp_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(webp_path, "WEBP", quality=85, method=6)


def wanted(key, only):
    return not only or key in only


def log_prompt(path, key, prompt):
    log = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    log[key] = prompt
    path.write_text(json.dumps(log, indent=2), encoding="utf-8")


def anchored_set(api, style, out_dir, prefix, subjects, only, extra):
    log = out_dir / "prompts.json"
    anchor_key = f"{prefix}{subjects[0]['id']}-male"
    anchor = out_dir / f"{anchor_key}.png"
    if wanted(anchor_key, only):
        print(f"[{anchor_key}] generations", flush=True)
        prompt = build_prompt(style, subjects[0], "male", False, extra)
        generate(api, prompt, anchor)
        log_prompt(log, anchor_key, prompt)
    for subj in subjects:
        for sex in SEXES:
            key = f"{prefix}{subj['id']}-{sex}"
            if key == anchor_key or not wanted(key, only):
                continue
            print(f"[{key}] edits with anchor", flush=True)
            prompt = build_prompt(style, subj, sex, True, extra)
            generate(api, prompt, out_dir / f"{key}.png", [anchor])
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


def generate_all(api, style, anchor, only, extra):
    stages = load_stages()
    log = ALL_RAW_DIR / "prompts.json"
    ALL_RAW_DIR.mkdir(parents=True, exist_ok=True)
    for stage in stages:
        refs = [anchor]
        for sex in SEXES:
            key = f"{stage['id']}-{sex}"
            raw = ALL_RAW_DIR / f"{key}.png"
            if wanted(key, only):
                print(f"[{key}] edits with {len(refs)} reference(s)", flush=True)
                prompt = build_prompt(style, stage, sex, True, extra)
                generate(api, prompt, raw, refs)
                log_prompt(log, key, prompt)
                to_webp(raw, PORTRAITS_DIR / f"{key}.webp")
            if raw.exists():
                refs = [anchor, raw]


def main():
    p = argparse.ArgumentParser(description="Generate hominin portraits with the OpenAI Images API")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--style-test", action="store_true")
    mode.add_argument("--full-body-test", action="store_true")
    mode.add_argument("--all", action="store_true")
    mode.add_argument("--contact-sheet", action="store_true")
    p.add_argument("--style", choices=sorted(STYLES))
    p.add_argument("--anchor", type=Path)
    p.add_argument("--only", default="", help="comma-separated keys, e.g. neanderthal-female or B-neanderthal-male")
    p.add_argument("--extra", default="", help="text appended to every prompt in this run")
    p.add_argument("--model", help="override the auto-picked model")
    args = p.parse_args()
    only = {k.strip() for k in args.only.split(",") if k.strip()}
    stages = load_stages()

    if args.contact_sheet:
        style_sheet(stages)
        full_body_sheet(stages)
        return

    if args.all and (not args.style or not args.anchor or not args.anchor.exists()):
        sys.exit("--all needs --style and an existing --anchor image")
    key = api_key()
    api = (key, args.model or pick_model(key))
    print(f"model {api[1]}", flush=True)
    subjects = [subject(stages, s) for s in TEST_STAGES]
    if args.style_test:
        for style in [args.style] if args.style else ["A", "B"]:
            anchored_set(api, style, STYLE_TEST_DIR, f"{style}-", subjects, only, args.extra)
        style_sheet(stages)
    elif args.full_body_test:
        anchored_set(api, "B", FULL_BODY_DIR, "", subjects, only, args.extra)
        full_body_sheet(stages)
    else:
        generate_all(api, args.style, args.anchor, only, args.extra)


if __name__ == "__main__":
    main()
