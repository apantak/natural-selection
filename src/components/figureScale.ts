import type { CSSProperties } from 'react'

export const REFERENCE_HEIGHT_M = 1.85
export const FIGURE_HEAD = 0.05
export const FIGURE_FLOOR = 0.955

const pct = (fraction: number) => `${+(fraction * 100).toFixed(3)}%`

/** Size of a full-length portrait relative to its frame, so a figure `meters` tall stands at true height against REFERENCE_HEIGHT_M. Capped at 1. */
export function figureScale(meters: number): number {
  return Math.min(1, Math.max(0, meters) / REFERENCE_HEIGHT_M)
}

/** Where a scaled portrait sits in its 2:3 frame, as fractions of the frame. Its feet stay on the FIGURE_FLOOR line. */
export function figureBox(meters: number): { left: number; top: number; width: number; height: number } {
  const scale = figureScale(meters)
  return { left: (1 - scale) / 2, top: FIGURE_FLOOR * (1 - scale), width: scale, height: scale }
}

/** Inline style that places a portrait image inside a `.figure-frame`. */
export function figureStyle(meters: number): CSSProperties {
  const box = figureBox(meters)
  return { left: pct(box.left), top: pct(box.top), width: pct(box.width), height: pct(box.height) }
}
