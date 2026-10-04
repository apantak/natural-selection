import { describe, expect, it } from 'vitest'
import { FIGURE_FLOOR, REFERENCE_HEIGHT_M, figureBox, figureScale, figureStyle } from './figureScale'

describe('figureScale', () => {
  it('scales linearly against the reference height', () => {
    expect(figureScale(REFERENCE_HEIGHT_M)).toBe(1)
    expect(figureScale(REFERENCE_HEIGHT_M / 2)).toBeCloseTo(0.5)
    expect(figureScale(1.06) / figureScale(1.72)).toBeCloseTo(1.06 / 1.72)
  })

  it('never grows past the frame or below zero', () => {
    expect(figureScale(2.4)).toBe(1)
    expect(figureScale(-1)).toBe(0)
  })
})

describe('figureBox', () => {
  it('fills the frame at the reference height', () => {
    expect(figureBox(REFERENCE_HEIGHT_M)).toEqual({ left: 0, top: 0, width: 1, height: 1 })
  })

  it('keeps short figures centred with their feet on the floor line', () => {
    for (const meters of [1.05, 1.3, 1.6, 1.78]) {
      const box = figureBox(meters)
      expect(box.left * 2 + box.width).toBeCloseTo(1)
      expect(box.top + FIGURE_FLOOR * box.height).toBeCloseTo(FIGURE_FLOOR)
      expect(box.top + box.height).toBeLessThanOrEqual(1)
    }
  })

  it('makes the shorter partner visibly smaller', () => {
    expect(figureBox(1.05).height).toBeLessThan(figureBox(1.51).height * 0.75)
  })
})

describe('figureStyle', () => {
  it('turns the box into percentages', () => {
    expect(figureStyle(REFERENCE_HEIGHT_M / 2)).toEqual({ left: '25%', top: '47.75%', width: '50%', height: '50%' })
  })
})
