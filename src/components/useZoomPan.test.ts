import { describe, expect, it } from 'vitest'
import {
  clampView,
  containBox,
  DOUBLE_TAP_SCALE,
  doubleTapView,
  FIT,
  isDoubleTap,
  MAX_SCALE,
  panView,
  pinchView,
  zoomAt,
  type Layout,
} from './useZoomPan'

const layout: Layout = {
  viewport: { left: 0, top: 0, width: 400, height: 800 },
  content: { left: 0, top: 100, width: 400, height: 600 },
}

describe('clampView', () => {
  it('keeps the scale between fit and the maximum', () => {
    expect(clampView({ scale: 10, x: 0, y: 0 }, layout).scale).toBe(MAX_SCALE)
    expect(clampView({ scale: 0.5, x: 0, y: 0 }, layout)).toEqual(FIT)
  })

  it('stops the image edges from being dragged inside the viewport', () => {
    expect(clampView({ scale: 2, x: 500, y: -999 }, layout)).toEqual({ scale: 2, x: 200, y: -200 })
  })

  it('keeps an axis that is smaller than the viewport on screen', () => {
    const view = clampView({ scale: 1.2, x: 0, y: 100 }, layout)
    expect(view.y).toBeCloseTo(40)
  })
})

describe('zoomAt', () => {
  it('keeps the content under the point in place', () => {
    const point = { x: 300, y: 250 }
    const view = zoomAt(FIT, 2, point, layout)
    const center = { x: 200, y: 400 }
    const before = { x: point.x - center.x, y: point.y - center.y }
    expect(view.x + before.x * 2).toBeCloseTo(before.x)
    expect(view.y + before.y * 2).toBeCloseTo(before.y)
  })

  it('recentres when zoomed back to fit', () => {
    expect(zoomAt({ scale: 2, x: 120, y: -80 }, 0.8, { x: 10, y: 10 }, layout)).toEqual(FIT)
  })
})

describe('doubleTapView', () => {
  it('zooms in on the tapped point from fit', () => {
    expect(doubleTapView(FIT, { x: 300, y: 400 }, layout)).toEqual({ scale: DOUBLE_TAP_SCALE, x: -150, y: 0 })
  })

  it('clamps a tap near the corner so no backdrop shows past the edge', () => {
    expect(doubleTapView(FIT, { x: 0, y: 100 }, layout)).toEqual({ scale: DOUBLE_TAP_SCALE, x: 300, y: 350 })
  })

  it('returns to fit when already zoomed', () => {
    expect(doubleTapView({ scale: 3, x: 40, y: 40 }, { x: 0, y: 0 }, layout)).toEqual(FIT)
  })
})

describe('pinchView', () => {
  const from = { center: { x: 200, y: 400 }, distance: 100 }

  it('scales by the finger spread and follows the midpoint', () => {
    expect(pinchView(FIT, from, { center: { x: 250, y: 400 }, distance: 200 }, layout)).toEqual({ scale: 2, x: 50, y: 0 })
  })

  it('stops at the maximum scale', () => {
    expect(pinchView(FIT, from, { center: from.center, distance: 1000 }, layout).scale).toBe(MAX_SCALE)
  })
})

describe('panView', () => {
  it('moves by the drag and clamps at the edges', () => {
    const start = { scale: 2, x: 0, y: 0 }
    expect(panView(start, 50, -30, layout)).toEqual({ scale: 2, x: 50, y: -30 })
    expect(panView(start, 900, 900, layout)).toEqual({ scale: 2, x: 200, y: 200 })
  })
})

describe('isDoubleTap', () => {
  const previous = { time: 1000, point: { x: 100, y: 100 } }

  it('times the gap from the first lift to the second press, like the platform', () => {
    expect(isDoubleTap(previous, 1220, { x: 105, y: 98 })).toBe(true)
    expect(isDoubleTap(previous, 1320, { x: 100, y: 100 })).toBe(false)
  })

  it('needs a first tap close to the second', () => {
    expect(isDoubleTap(null, 1100, { x: 100, y: 100 })).toBe(false)
    expect(isDoubleTap(previous, 1100, { x: 200, y: 100 })).toBe(false)
  })
})

describe('containBox', () => {
  it('fits a 2:3 image inside the box and centres it', () => {
    expect(containBox({ left: 0, top: 0, width: 400, height: 800 }, 2 / 3)).toEqual({ left: 0, top: 100, width: 400, height: 600 })
    expect(containBox({ left: 0, top: 0, width: 900, height: 600 }, 2 / 3)).toEqual({ left: 250, top: 0, width: 400, height: 600 })
  })
})
