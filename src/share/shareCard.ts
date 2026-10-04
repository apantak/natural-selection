import { portraitUrl } from '../content/loader'
import type { Stage } from '../content/types'
import type { GameResults, Player } from '../game/types'
import { ellipsize, fitFont, wrapLines } from './canvasText'
import { joinNames, NO_GROUP_CUTOFF, summarize, type RankedPlayer, type ResultsSummary } from './summary'

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1920
export const SHARE_FILENAME = 'will-you-accept-this-bone.png'

export interface ShareCardOptions {
  results: GameResults
  players: Player[]
  stages: Stage[]
  hideNames: boolean
}

const C = {
  bg: '#15100c',
  surface: '#2a1f18',
  ivory: '#f1e6d2',
  ivoryMuted: '#cbbba2',
  ivoryFaint: '#998870',
  gold: '#c9a45c',
  goldBright: '#ecca84',
  goldDeep: '#8d6b30',
  goldLine: 'rgba(201, 164, 92, 0.42)',
  goldWash: 'rgba(201, 164, 92, 0.1)',
  rose: '#d9a0a3',
}

const DISPLAY = "'Fraunces Variable', 'Iowan Old Style', Georgia, serif"
const BODY = "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
const display = (size: number, weight = 600, italic = false) => `${italic ? 'italic ' : ''}${weight} ${size}px ${DISPLAY}`
const body = (size: number, weight = 500) => `${weight} ${size}px ${BODY}`

const FONT_FACES = [display(40), display(40, 500, true), body(40, 600)]
const CX = CARD_WIDTH / 2
const LIST_BOTTOM = 1790

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

function loadImage(path: string): Promise<HTMLImageElement | null> {
  const src = portraitUrl(path)
  let pending = imageCache.get(src)
  if (!pending) {
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    pending = img.decode().then(
      () => img,
      () => null,
    )
    imageCache.set(src, pending)
  }
  return pending
}

async function fontsReady(): Promise<void> {
  try {
    await Promise.all(FONT_FACES.map((f) => document.fonts.load(f)))
    await document.fonts.ready
  } catch {
    return
  }
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`
}

function eyebrow(ctx: CanvasRenderingContext2D, text: string, y: number, color = C.gold) {
  ctx.save()
  ctx.font = body(26, 650)
  setSpacing(ctx, 6)
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(text.toUpperCase(), CX + 3, y)
  ctx.restore()
}

function ornamentRule(ctx: CanvasRenderingContext2D, y: number, half = 300) {
  ctx.save()
  for (const dir of [-1, 1]) {
    const g = ctx.createLinearGradient(CX + dir * 30, 0, CX + dir * half, 0)
    g.addColorStop(0, C.goldLine)
    g.addColorStop(1, 'rgba(201, 164, 92, 0)')
    ctx.fillStyle = g
    ctx.fillRect(Math.min(CX + dir * 30, CX + dir * half), y - 1, half - 30, 2)
  }
  ctx.fillStyle = C.gold
  ctx.font = body(26)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✦', CX, y + 1)
  ctx.restore()
}

function noisePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tile = document.createElement('canvas')
  tile.width = tile.height = 160
  const tctx = tile.getContext('2d')
  if (!tctx) return null
  const data = tctx.createImageData(160, 160)
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.random() * 255
    data.data[i] = v
    data.data[i + 1] = v * 0.9
    data.data[i + 2] = v * 0.75
    data.data[i + 3] = 255
  }
  tctx.putImageData(data, 0, 0)
  return ctx.createPattern(tile, 'repeat')
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  for (let x = 0; x < CARD_WIDTH; x += 23) {
    ctx.fillStyle = 'rgba(255, 220, 170, 0.022)'
    ctx.fillRect(x, 0, 2, CARD_HEIGHT)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
    ctx.fillRect(x + 9, 0, 2, CARD_HEIGHT)
  }

  const velvet = ctx.createRadialGradient(CX, -260, 0, CX, -260, 1450)
  velvet.addColorStop(0, 'rgba(120, 44, 52, 0.62)')
  velvet.addColorStop(0.45, 'rgba(61, 26, 31, 0.3)')
  velvet.addColorStop(0.8, 'rgba(61, 26, 31, 0)')
  ctx.fillStyle = velvet
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const spot = ctx.createRadialGradient(CX, 640, 0, CX, 640, 560)
  spot.addColorStop(0, 'rgba(236, 202, 132, 0.16)')
  spot.addColorStop(1, 'rgba(236, 202, 132, 0)')
  ctx.fillStyle = spot
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const grain = noisePattern(ctx)
  if (grain) {
    ctx.save()
    ctx.globalAlpha = 0.07
    ctx.globalCompositeOperation = 'overlay'
    ctx.fillStyle = grain
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    ctx.restore()
  }

  const vignette = ctx.createRadialGradient(CX, 820, 620, CX, 820, 1500)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.62)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
}

function drawFrame(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = C.gold
  ctx.globalAlpha = 0.7
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, CARD_WIDTH - 80, CARD_HEIGHT - 80)
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  ctx.strokeRect(54, 54, CARD_WIDTH - 108, CARD_HEIGHT - 108)
  ctx.globalAlpha = 1
  ctx.fillStyle = C.goldBright
  for (const [x, y] of [[47, 47], [CARD_WIDTH - 47, 47], [47, CARD_HEIGHT - 47], [CARD_WIDTH - 47, CARD_HEIGHT - 47]]) {
    ctx.beginPath()
    ctx.moveTo(x, y - 12)
    ctx.lineTo(x + 12, y)
    ctx.lineTo(x, y + 12)
    ctx.lineTo(x - 12, y)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function drawTitle(ctx: CanvasRenderingContext2D) {
  eyebrow(ctx, 'Tonight, live from the museum', 135)
  ctx.save()
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(236, 202, 132, 0.3)'
  ctx.shadowBlur = 28
  ctx.font = display(96, 650)
  ctx.fillStyle = C.ivory
  ctx.textAlign = 'center'
  ctx.fillText('Will You Accept', CX, 232)
  ctx.textAlign = 'left'
  const lead = 'This '
  const leadWidth = ctx.measureText(lead).width
  ctx.font = display(96, 500, true)
  const boneWidth = ctx.measureText('Bone?').width
  const start = CX - (leadWidth + boneWidth) / 2
  ctx.font = display(96, 650)
  ctx.fillText(lead, start, 324)
  ctx.font = display(96, 500, true)
  ctx.fillStyle = C.goldBright
  ctx.fillText('Bone?', start + leadWidth, 324)
  ctx.restore()
  ornamentRule(ctx, 378)
}

function archPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = w / 2
  const b = 22
  ctx.beginPath()
  ctx.moveTo(x, y + r)
  ctx.arc(x + r, y + r, r, Math.PI, 0)
  ctx.lineTo(x + w, y + h - b)
  ctx.quadraticCurveTo(x + w, y + h, x + w - b, y + h)
  ctx.lineTo(x + b, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - b)
  ctx.closePath()
}

function drawPortrait(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, cx: number, cy: number, w: number, h: number, tilt: number) {
  const x = -w / 2
  const y = -h / 2
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(tilt)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 28
  archPath(ctx, x, y, w, h)
  ctx.fillStyle = C.surface
  ctx.fill()
  ctx.restore()

  ctx.save()
  archPath(ctx, x, y, w, h)
  ctx.clip()
  const backdrop = ctx.createRadialGradient(0, y + h * 0.32, 0, 0, y + h * 0.32, h * 0.75)
  backdrop.addColorStop(0, '#3a2c22')
  backdrop.addColorStop(1, '#120d0a')
  ctx.fillStyle = backdrop
  ctx.fillRect(x, y, w, h)
  if (img) {
    const iw = img.naturalWidth || w
    const ih = img.naturalHeight || h
    const scale = Math.min(w / iw, h / ih)
    ctx.drawImage(img, -iw * scale / 2, y + h - ih * scale, iw * scale, ih * scale)
  }
  const shade = ctx.createLinearGradient(0, y + h * 0.7, 0, y + h)
  shade.addColorStop(0, 'rgba(13, 9, 7, 0)')
  shade.addColorStop(1, 'rgba(13, 9, 7, 0.3)')
  ctx.fillStyle = shade
  ctx.fillRect(x, y, w, h)
  ctx.restore()

  const gilt = ctx.createLinearGradient(0, y, 0, y + h)
  gilt.addColorStop(0, '#f0d28f')
  gilt.addColorStop(0.5, '#d2ad63')
  gilt.addColorStop(1, '#a9843e')
  ctx.lineWidth = 5
  ctx.strokeStyle = gilt
  archPath(ctx, x, y, w, h)
  ctx.stroke()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = C.goldLine
  archPath(ctx, x + 12, y + 12, w - 24, h - 24)
  ctx.stroke()
  ctx.restore()
}

function centeredFit(ctx: CanvasRenderingContext2D, text: string, y: number, maxWidth: number, size: number, minSize: number, font: (s: number) => string, color: string) {
  fitFont(ctx, text, maxWidth, size, minSize, font)
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(ellipsize(ctx, text, maxWidth), CX, y)
}

function portraitHeight(playerCount: number): number {
  if (playerCount <= 4) return 480
  if (playerCount <= 6) return 440
  return 400
}

function drawGroup(ctx: CanvasRenderingContext2D, summary: ResultsSummary, stageCount: number, images: (HTMLImageElement | null)[], ph: number): number {
  const top = 470
  const stage = summary.group
  eyebrow(ctx, stage ? 'The group drew the line at' : 'The group drew the line', top - 38)
  if (!stage || summary.groupIndex === null) {
    ctx.save()
    ctx.translate(CX, top + ph * 0.42)
    ctx.rotate(-0.42)
    ctx.font = `180px ${BODY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🦴', 0, 0)
    ctx.restore()
    ctx.save()
    ctx.font = display(72, 500, true)
    ctx.fillStyle = C.goldBright
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(236, 202, 132, 0.3)'
    ctx.shadowBlur = 24
    const lines = wrapLines(ctx, NO_GROUP_CUTOFF, 820)
    const first = top + ph - 40
    lines.forEach((line, i) => ctx.fillText(line, CX, first + i * 84))
    ctx.restore()
    return first + (lines.length - 1) * 84 + 30
  }

  const pw = (ph * 2) / 3
  drawPortrait(ctx, images[0], CX - pw / 2 - 20, top + ph / 2, pw, ph, -0.035)
  drawPortrait(ctx, images[1], CX + pw / 2 + 20, top + ph / 2, pw, ph, 0.035)

  let y = top + ph + 84
  ctx.save()
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(236, 202, 132, 0.25)'
  ctx.shadowBlur = 24
  centeredFit(ctx, stage.species, y, 900, 76, 48, (s) => display(s, 620), C.ivory)
  ctx.restore()

  ctx.save()
  if (stage.nickname) {
    y += 60
    centeredFit(ctx, `“${stage.nickname}”`, y, 860, 48, 32, (s) => display(s, 500, true), C.goldBright)
  }
  y += 52
  centeredFit(ctx, `Stage ${summary.groupIndex + 1} of ${stageCount} · ${stage.lived.display}`, y, 880, 30, 22, (s) => body(s, 500), C.ivoryMuted)
  ctx.restore()
  return y + 18
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawCrown(ctx: CanvasRenderingContext2D, names: string[], top: number): number {
  if (!names.length) return top
  const x = 110
  const w = CARD_WIDTH - 220
  const h = 128
  ctx.save()
  const wash = ctx.createLinearGradient(0, top, 0, top + h)
  wash.addColorStop(0, 'rgba(201, 164, 92, 0.2)')
  wash.addColorStop(1, 'rgba(201, 164, 92, 0.06)')
  ctx.shadowColor = 'rgba(201, 164, 92, 0.45)'
  ctx.shadowBlur = 40
  roundRect(ctx, x, top, w, h, 32)
  ctx.fillStyle = wash
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(236, 202, 132, 0.55)'
  ctx.stroke()
  ctx.restore()

  eyebrow(ctx, '👑  Last one standing', top + 46, C.goldBright)
  ctx.save()
  ctx.textBaseline = 'alphabetic'
  centeredFit(ctx, joinNames(names), top + 104, w - 80, 50, 30, (s) => display(s, 620), C.ivory)
  ctx.restore()
  return top + h
}

function drawRow(ctx: CanvasRenderingContext2D, row: RankedPlayer, y: number, size: number, last: boolean) {
  const left = 120
  const right = CARD_WIDTH - 120
  ctx.save()
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = display(Math.round(size * 1.05), 600)
  ctx.fillStyle = C.gold
  ctx.fillText(String(row.rank), left, y)

  const nameX = left + size * 1.6
  ctx.font = body(size, 620)
  const name = ellipsize(ctx, row.name, 360)
  ctx.fillStyle = row.crowned ? C.goldBright : C.ivory
  ctx.fillText(name, nameX, y)
  let used = nameX + ctx.measureText(name).width
  if (row.crowned) {
    ctx.font = `${Math.round(size * 0.8)}px ${BODY}`
    ctx.fillText(' 👑', used, y)
    used += ctx.measureText(' 👑').width
  }

  const room = right - used - 36
  ctx.textAlign = 'right'
  const never = row.cutoff === null
  fitFont(ctx, row.label, room, Math.round(size * 0.92), 22, (s) => display(s, 480, true))
  ctx.fillStyle = never ? C.rose : C.ivoryMuted
  ctx.fillText(ellipsize(ctx, row.label, room), right, y)

  if (!last) {
    ctx.fillStyle = 'rgba(201, 164, 92, 0.2)'
    ctx.fillRect(left, y + size * 0.95, right - left, 1)
  }
  ctx.restore()
}

function drawRanking(ctx: CanvasRenderingContext2D, ranking: RankedPlayer[], top: number) {
  const space = LIST_BOTTOM - top
  const rowH = Math.min(86, (space - 64) / Math.max(ranking.length, 1))
  const blockH = 64 + rowH * ranking.length
  const start = top + Math.max(0, (space - blockH) / 2)
  eyebrow(ctx, 'How far back would you go?', start + 24)
  const size = Math.round(Math.min(40, rowH * 0.5))
  ranking.forEach((row, i) => drawRow(ctx, row, start + 64 + rowH * (i + 0.5), size, i === ranking.length - 1))
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.font = body(24, 500)
  ctx.fillStyle = C.ivoryFaint
  ctx.textAlign = 'center'
  setSpacing(ctx, 1)
  ctx.fillText('A dating show across 7 million years of human relatives', CX, CARD_HEIGHT - 82)
  ctx.restore()
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the share card.'))), 'image/png')
  })
}

export async function renderShareCard({ results, players, stages, hideNames }: ShareCardOptions): Promise<Blob> {
  const summary = summarize({ results, players, stages, hideNames })
  const group = summary.group
  const [images] = await Promise.all([
    group ? Promise.all([loadImage(group.images.female), loadImage(group.images.male)]) : [],
    fontsReady(),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available.')

  drawBackground(ctx)
  drawFrame(ctx)
  drawTitle(ctx)
  const groupBottom = drawGroup(ctx, summary, stages.length, images, portraitHeight(players.length))
  const crownBottom = drawCrown(ctx, summary.crowned, groupBottom + 24)
  drawRanking(ctx, summary.ranking, crownBottom + 24)
  drawFooter(ctx)
  return toBlob(canvas)
}
