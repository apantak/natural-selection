# Theme and shared UI

"Museum after hours meets dating show." Dark only. Everything below is loaded once in `src/main.tsx` (fonts, `tokens.css`, `global.css`), so screens just use the classes and variables.

## Tokens (`tokens.css`)

| Group | Variables |
| --- | --- |
| Backgrounds | `--color-bg` (#15100c, matches the manifest theme colour), `--color-bg-deep`, `--color-velvet`, `--color-velvet-deep`, `--color-wood`, `--color-surface` (translucent panel), `--color-surface-solid`, `--color-surface-raised`, `--color-scrim` |
| Text | `--color-ivory` (body), `--color-ivory-muted`, `--color-ivory-faint`, `--color-ink` (text on gold) |
| Gold accent | `--color-gold`, `--color-gold-bright`, `--color-gold-deep`, `--color-gold-line` (hairlines), `--color-gold-wash` |
| Dusty rose | `--color-rose`, `--color-rose-deep`, `--color-rose-wash` |
| Semantic | `--color-accept` (gold), `--color-cutoff` (rose), `--color-danger` |
| Gradients / texture | `--gradient-gold`, `--gradient-velvet`, `--gradient-vignette`, `--gradient-fade-up`, `--texture-grain`, `--texture-wood` |
| Type | `--font-display` ('Fraunces Variable', opsz axis + italic loaded), `--font-body` ('Inter Variable'); sizes `--text-xs` 15px, `--text-sm` 17px, `--text-md` 20px (body), `--text-lg` 24px, `--text-xl` 32px, `--text-2xl`, `--text-hero` (fluid); `--leading-tight/snug/body`, `--tracking-eyebrow` |
| Space | `--space-1`..`--space-8` (4, 8, 12, 16, 24, 32, 48, 64px), `--gutter` 20px, `--content-max` 34rem |
| Tap targets | `--tap-min` 56px, `--tap-lg` 64px |
| Shape | `--radius-sm/md/lg/pill`, `--hairline` (1px gold border shorthand) |
| Depth | `--shadow-card`, `--shadow-lift`, `--glow-gold`, `--glow-rose`, `--text-glow` |
| Motion (CSS) | `--dur-fast` 120ms, `--dur-ui` 240ms, `--dur-slow` 420ms, `--ease-out`, `--ease-spring` |
| Safe area | `--safe-top/bottom/left/right` |
| Layers | `--z-burst` 40, `--z-overlay` 50 (portrait viewer), `--z-dialog` 60 |

Canvas code (share card) can use the same font family names: `'Fraunces Variable'` and `'Inter Variable'`.

## Global classes (`global.css`)

- Type: `.title-hero`, `.title` (h1 size), `.subtitle`, `.display` (Fraunces on any element), `.eyebrow` (gold small caps label), `.lede`, `.accent` (gold italic), `.rose`, `.muted`, `.faint`, `.small`, `.center`
- Layout: `.stack`, `.stack-sm`, `.stack-lg` (flex column gaps), `.row`
- Decoration: `.card` (velvet panel, gold hairline), `.card-rose`, `.rule` (gold hairline divider; put an ornament like `✦` inside, or leave it empty)
- A11y: `.visually-hidden`
- `prefers-reduced-motion` kills CSS transitions; Motion animations obey `MotionConfig reducedMotion="user"` set in `App.tsx`.

## Motion presets (`motion.ts`)

`springUi` (fast UI spring), `springSoft`, `springPop` (bouncy reveal), `screenVariants` (used by App screen transitions), `fadeUp` + `stagger(delay, step)` for staggered entrances (`variants={stagger()} initial="hidden" animate="show"` on the parent, `variants={fadeUp}` on children).

## Components (`src/components`, import from `'../components'`)

| Component | Props | Notes |
| --- | --- | --- |
| `Button` | `variant` primary / secondary / ghost / danger, `size` lg (64px, default) / md (56px), `block`, plus any `motion.button` props | Springy tap scale. |
| `ScreenLayout` | `header`, `actions`, `children`, `centered`, `className` | Safe-area padding; `actions` is a sticky bottom bar with a fade. Every screen should use it. |
| `ConfirmDialog` | `open`, `title`, `message`, `confirmLabel`, `cancelLabel`, `destructive`, `onConfirm`, `onCancel` | In-app modal (portal). Focuses cancel, Escape and backdrop cancel. Never use `window.confirm`. |
| `PlayerTile` | `name`, `selected`, `onToggle`, `disabled`, `acceptLabel`, `cutoffLabel` | Vote grid tile, `aria-pressed`. Use in a 2-column grid. |
| `PortraitViewer` | `open`, `stage`, `initialSide` 'female' / 'male', `onClose` | Fullscreen overlay. Swipe or tap toggles side, segmented control, close button, Escape / arrow keys. Uses `portraitUrl`. |
| `Countdown` | `onDone`, `from` (3), `stepMs` (900), `finalLabel` ('Vote!') | Animated 3-2-1, then final label, then `onDone` once. |
| `BoneBurst` | `variant` 'bone' / 'dust', `play` | Fires on mount (or when `play` turns true). Imperative versions: `fireBoneBurst()`, `fireDustBurst()`. Disabled under reduced motion. |
| `Badge` | `children` ('18+'), `tone` gold / rose, `label` | |
| `InstallHint` | none | One-time iOS Safari "Add to Home Screen" tip (Home screen). |

## App plumbing (`src/app`)

- `useGame()` returns `{ state, dispatch, stages, stage, outcome, results }` from the `GameProvider` in `App.tsx`. State is restored from and saved to `sessionStorage`.
- `useBackGuard` (used by `App.tsx`) keeps one history entry above the app. Back on setup or credits goes home. Back during intro, vote, ceremony or end opens "Quit game?", and confirming dispatches `newGame`.
