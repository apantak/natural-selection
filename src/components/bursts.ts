import confetti from 'canvas-confetti'

export type BurstVariant = 'bone' | 'dust'

const Z_INDEX = 40
const GOLDS = ['#ecca84', '#c9a45c', '#f1e6d2', '#d9a0a3']
const DUSTS = ['#8a7560', '#a8927a', '#6e5d4c', '#c2ae93']

const base: confetti.Options = { disableForReducedMotion: true, zIndex: Z_INDEX }

export function fireBoneBurst() {
  const scalar = 2.6
  const bone = confetti.shapeFromText({ text: '🦴', scalar })
  const bones: confetti.Options = { ...base, shapes: [bone], scalar, flat: false, ticks: 240, gravity: 0.9 }
  confetti({ ...bones, particleCount: 36, spread: 80, startVelocity: 52, origin: { x: 0.5, y: 0.72 } })
  confetti({ ...bones, particleCount: 16, angle: 62, spread: 50, startVelocity: 58, origin: { x: 0, y: 0.85 } })
  confetti({ ...bones, particleCount: 16, angle: 118, spread: 50, startVelocity: 58, origin: { x: 1, y: 0.85 } })
  confetti({ ...base, particleCount: 90, spread: 110, startVelocity: 40, scalar: 0.8, colors: GOLDS, shapes: ['circle', 'square'], origin: { x: 0.5, y: 0.7 } })
}

export function fireDustBurst() {
  const scalar = 2.2
  const leaf = confetti.shapeFromText({ text: '🍂', scalar })
  confetti({ ...base, particleCount: 80, spread: 170, startVelocity: 14, gravity: 0.2, drift: 1.4, decay: 0.93, ticks: 300, scalar: 0.75, colors: DUSTS, shapes: ['circle'], origin: { x: 0.5, y: 0.9 } })
  confetti({ ...base, particleCount: 4, angle: 15, spread: 20, startVelocity: 38, gravity: 0.5, drift: 2, ticks: 320, shapes: [leaf], scalar, flat: false, origin: { x: -0.05, y: 0.82 } })
}
