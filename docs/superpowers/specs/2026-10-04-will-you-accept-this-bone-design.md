# Will You Accept This Bone? — design

Date: 2026-10-04. Source: "Natural Selection — rough requirements" plus planning session. Research and sources: `docs/research/2026-10-04-planning-research.md`.

## Product

A host-run adult (18+) party game for 3–8 players around one phone, about an hour long. The group walks back through 10 human relatives, from early Homo sapiens to Sahelanthropus. At each stage the host reads out a short, true science write-up and shows two portraits (female, male). Everyone votes at the same moment: thumbs up to **accept the bone**, thumbs down for **cutoff**. The tone is a Bachelor-style dating show parody: "Will you accept this bone?" Ridiculous premise, real science.

Name: **Will You Accept This Bone?** (cleared as low trademark risk; never use "Bachelor", ABC/Warner names, rose imagery or show branding).

## Platform

- Installable, fully offline PWA. React 19 + TypeScript + Vite + Motion (motion.dev) for animation, canvas-confetti for particle bursts.
- Hosted on GitHub Pages from `git@github.com:apantak/natural-selection.git`, deployed by a GitHub Action on push to `main` after tests and the content check pass.
- No backend, accounts or analytics. Portrait orientation. Text readable at arm's length.
- Fonts self-hosted (`@fontsource-variable/fraunces` display, `@fontsource-variable/inter` body) so offline works.

## Game flow

Screens: **Home → Setup → (Stage intro → Vote → Bone Ceremony) × stages → End**, plus a Credits screen reachable from Home.

1. **Home**: title, tagline, 18+ badge, one-tap "We're all adults" confirmation before Start. Link to Credits. One-time iOS "Share → Add to Home Screen" hint when not installed.
2. **Setup**: 3–8 players. Add, remove, reorder. Names trimmed, non-empty, unique (case-insensitive), max 16 chars. Start enabled only when valid.
3. **Stage intro** (host reads aloud): stage number, species, nickname, date range, description, 2–3 facts, female and male portraits. Tapping a portrait opens a fullscreen viewer for showing the room; swipe or tap toggles female/male.
4. **Vote** (host collects): full-screen "On three: 👍 accept the bone, 👎 cutoff" with an optional animated 3-2-1 countdown. Then a grid of large name tiles, all defaulting to cutoff; host taps players who accepted (tap toggles), then confirms. Editable until confirmed.
5. **Bone Ceremony** (reveal): player cards revealed one at a time, flying right (accepted, bone) or left (cutoff). Then a "Justify yourself" prompt naming the accepters, then the stage punchline if present. Exactly one accepter triggers the lone-holdout spotlight ("Dave, you're the last one holding a bone. Defend yourself."). Unanimous accept triggers a bone particle burst. Buttons: **Continue** (only if ≥1 accepted and a further unlocked stage exists) and **End here** (always).
6. **End**: group cutoff species with portrait, each player's personal cutoff, "Last one standing" crown, share button with a "Hide names" toggle, Play again (same players) and New game.

## Rules

- Every player votes at every stage, including those who voted cutoff before.
- After votes are submitted for a stage, the game ends if nobody accepted, or if that was the last stage. Otherwise the host may Continue or End here.
- Ending: `nobody-accepted`, `out-of-stages`, or `host-ended`.
- **Personal cutoff**: the last stage index the player accepted, or `null` if they never accepted (label: "Rejected their own species").
- **Group cutoff**: the last stage index where a strict majority (> half) of players accepted, or `null` if none.
- **Last one standing**: the player(s) with the deepest personal cutoff (ties share); empty if nobody ever accepted.
- **Lone holdout**: exactly one player accepted at a stage, with ≥2 players.

## Architecture

```
src/game/       pure TS: types.ts (contract), engine.ts (reducer + derivations), persistence.ts. No React.
src/content/    stages.json, types.ts (contract), loader.ts, validate.ts (used by scripts/validate-content.ts)
src/screens/    one React component per screen
src/components/ shared UI (Button, PortraitViewer, PlayerTile, Countdown, BoneBurst)
src/share/      shareCard.ts (canvas render), share.ts (Web Share with fallbacks)
src/theme/      tokens.css, global styles
src/paywall.ts  isStageUnlocked(index) — returns true; the only paywall seam
public/portraits/  <stage-id>-female.webp, <stage-id>-male.webp; placeholder-female.svg, placeholder-male.svg
tools/          generate_portraits.py (OpenAI), prompt template, style test outputs (tools/out/, gitignored)
```

- The engine is a reducer: `createReducer(stageCount)` returns `(state, action) → state`. Votes enter only through `submitVotes(StageVotes)`, so a future networked vote source plugs in without engine changes.
- State persists to `sessionStorage` on every change and restores on load, so a phone lock or reload doesn't lose the game. Cleared on New game; nothing survives the tab.
- Android back button: a history entry per screen; back asks "Quit game?" during play.
- Stages are imported at build time from `src/content/stages.json`. A content validator (JSON schema via ajv + file existence for images) runs in `npm run check:content` and in CI.
- `isStageUnlocked(index)` gates Continue. It returns `true` for every stage today.

## Content

Each stage record (`src/content/types.ts`): `id`, `order`, `species`, optional `nickname`, `lived { fromYearsAgo, toYearsAgo, display }`, `description`, `facts` (2–3), optional `punchline`, `images { female, male }`, `anatomy { female, male }` (prompt notes, not shown), `sources [{ claim, url }]` (≥1), `lastChecked` (ISO date).

Stage order: 1 Early Homo sapiens, 2 Neanderthal, 3 Denisovan ("Dragon Man"), 4 Homo heidelbergensis, 5 Homo erectus, 6 Homo floresiensis, 7 Homo habilis, 8 Australopithecus afarensis ("Lucy"), 9 Ardipithecus ramidus ("Ardi"), 10 Sahelanthropus tchadensis ("Toumaï").

Copy rules:
- Bachelor-host voice. Jokes target the players and the situation, never the faces or bodies of the hominins.
- "Relatives", not "ancestors", for cousin species (Neanderthals, Denisovans, floresiensis). No ladder language.
- Hedge contested claims ("scientists think", "one study suggests").
- Research corrections apply: heidelbergensis "possibly near our common ancestor"; erectus ~2 million to ~110,000 years ago, "first we know of" to leave Africa, "probably" first to use fire (didn't make it); habilis did not invent the first tools; Sahelanthropus "may have" walked upright; Denisovans have a face via the 2025 Harbin "Dragon Man" ID; label stage 3 "Denisovan", never "H. longi".
- No race, ethnicity, "primitive" or "ugly" wording. Every fact has a source URL.

## Portraits

- `tools/generate_portraits.py` uses the OpenAI Images API with `OPENAI_API_KEY` (user env var). Prefer GPT Image 2 if available, else `gpt-image-1.5`. Edits endpoint with an anchor reference image for consistency.
- Locked prompt template (see research notes): chest-up, three-quarter view, head in upper 55% of a 4:5 frame, plain backdrop, adult ordinary unretouched individual, garment fully covering chest and shoulders, calm or mildly amused expression, mouth closed, no makeup/jewellery/modern items. Never put "smash", "sexy", "attractive", "nude" or ethnic comparisons in prompts.
- Style test first: Neanderthal and A. afarensis, female and male, in **Style B: oil portrait** and **Style A: 90s school picture day** (8 images). The user picks; the winner's Neanderthal male becomes the anchor. Then generate the other 16.
- Review checklist per image: fully clothed, no glamour, matches the anatomy note, skin and hair from evidence and never "older = darker".
- Output 1024×1280 WebP in `public/portraits/`. Credit: "Portraits are AI-generated artistic reconstructions."
- Until approved, stages point at placeholder silhouettes so the game is playable.

## Visual direction

"Museum after hours meets dating show." Dark warm background (aged wood/velvet), bone-ivory text, antique gold accent, a dusty rose for the dating-show flourishes. Fraunces display headings, Inter body. Large tap targets (≥56px), body text ≥20px. Motion: springy, fast (≤300ms for UI, longer only for ceremony beats). Respect `prefers-reduced-motion`. Dark only.

## Share image

1080×1920 canvas card: title, group cutoff species and portrait, each player's personal cutoff, "Last one standing" crown. "Hide names" toggle replaces names with "Player 1…n". Rendered when the End screen loads (after `document.fonts.ready` and image decode), so Share calls `navigator.share({ files })` directly in the tap handler after `canShare`. Fallback: PNG download on browsers without file sharing (Firefox), never inside an installed iOS web app.

## Offline and install

`vite-plugin-pwa` with Workbox precache of the app shell, fonts and portraits. Manifest: standalone, portrait, dark theme colour, icons. Base path set for GitHub Pages (`/natural-selection/`).

## Testing

- Vitest unit tests for the engine: every rule above, lone holdout, ties, never-accepted, end reasons, persistence round-trip, setup validation.
- Content validator test against the real `stages.json`.
- Playwright (Chromium, Pixel-sized viewport): a full 3-player game from Home to End, plus an offline reload check against the production preview build.
- `npm run build` and `npm run lint` clean.

## Out of scope (v1)

Networked/multi-phone play (seam only), scoring, timers, extra packs, monetisation (seam only), localisation, app store builds.
