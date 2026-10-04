import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export interface View {
  scale: number
  x: number
  y: number
}

export interface Point {
  x: number
  y: number
}

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export interface Layout {
  viewport: Box
  content: Box
}

export interface Pinch {
  center: Point
  distance: number
}

export type ZoomPhase = 'idle' | 'gesture' | 'animate'

export const FIT: View = { scale: 1, x: 0, y: 0 }
export const MAX_SCALE = 3
export const DOUBLE_TAP_SCALE = 2.5
export const ZOOM_STEP = 1.6
export const DOUBLE_TAP_MS = 300

const FIT_SNAP = 1.02
const TAP_SLOP = 10
const TAP_MS = 300
const DOUBLE_TAP_SLOP = 40
const SWIPE_DISTANCE = 60
const SWIPE_SPEED = 0.45
const SWIPE_RESIST = 0.35

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function clampAxis(offset: number, scale: number, size: number, start: number, viewStart: number, viewSize: number) {
  const center = start + size / 2
  const half = (size * scale) / 2
  const flushStart = viewStart - center + half
  const flushEnd = viewStart + viewSize - center - half
  return clamp(offset, Math.min(flushStart, flushEnd), Math.max(flushStart, flushEnd))
}

/** Limits scale to fit..MAX_SCALE and keeps the content edges from being dragged inside the viewport (or out of it while smaller). */
export function clampView(view: View, { viewport, content }: Layout): View {
  const scale = clamp(view.scale, 1, MAX_SCALE)
  if (scale === 1 && view.x === 0 && view.y === 0) return FIT
  return {
    scale,
    x: clampAxis(view.x, scale, content.width, content.left, viewport.left, viewport.width),
    y: clampAxis(view.y, scale, content.height, content.top, viewport.top, viewport.height),
  }
}

function zoomRaw(view: View, scale: number, point: Point, { content }: Layout): View {
  const next = clamp(scale, 1, MAX_SCALE)
  const px = point.x - (content.left + content.width / 2)
  const py = point.y - (content.top + content.height / 2)
  const ratio = next / view.scale
  return { scale: next, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio }
}

/** Zooms to `scale` keeping the content under `point` (viewport coordinates) in place. Reaching fit scale recentres. */
export function zoomAt(view: View, scale: number, point: Point, layout: Layout): View {
  const next = zoomRaw(view, scale, point, layout)
  return next.scale === 1 ? FIT : clampView(next, layout)
}

/** Double-tap: from fit, zoom to DOUBLE_TAP_SCALE on the tapped point; when zoomed, return to fit. */
export function doubleTapView(view: View, point: Point, layout: Layout): View {
  return view.scale > 1 ? FIT : zoomAt(view, DOUBLE_TAP_SCALE, point, layout)
}

/** Two-finger pinch from the gesture's starting view: scales by the finger spread and follows the midpoint. */
export function pinchView(start: View, from: Pinch, to: Pinch, layout: Layout): View {
  const next = zoomRaw(start, (start.scale * to.distance) / from.distance, from.center, layout)
  return clampView({ ...next, x: next.x + to.center.x - from.center.x, y: next.y + to.center.y - from.center.y }, layout)
}

/** One-finger drag from the gesture's starting view. */
export function panView(start: View, dx: number, dy: number, layout: Layout): View {
  return clampView({ ...start, x: start.x + dx, y: start.y + dy }, layout)
}

/** The box an image of `aspect` (width / height) fills inside `box` with object-fit: contain. */
export function containBox(box: Box, aspect: number): Box {
  const width = Math.min(box.width, box.height * aspect)
  const height = width / aspect
  return { left: box.left + (box.width - width) / 2, top: box.top + (box.height - height) / 2, width, height }
}

/** Whether a tap that went down at `down` completes a double-tap with the tap that ended at `previous` (platform timing: first up to second down). */
export function isDoubleTap(previous: { time: number; point: Point } | null, down: number, point: Point): boolean {
  return !!previous && down - previous.time < DOUBLE_TAP_MS && Math.hypot(point.x - previous.point.x, point.y - previous.point.y) < DOUBLE_TAP_SLOP
}

function pinchOf(a: Point, b: Point): Pinch {
  return { center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) }
}

const toBox = (rect: DOMRect): Box => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })

type Gesture =
  | { kind: 'pinch'; start: View; layout: Layout; from: Pinch }
  | { kind: 'pan' | 'swipe'; start: View; layout: Layout; origin: Point; time: number }

interface Tap {
  time: number
  point: Point
}

interface ZoomPanOptions {
  aspect: number
  onSwipe: () => void
}

/**
 * Pinch, double-tap, drag and wheel zoom for `frameRef`, an image of `aspect` that fits inside `fitRef`, with gestures read on `surfaceRef`.
 * Panning stops at the edges of `fitRef`, the area the controls leave clear. At fit scale a horizontal swipe calls `onSwipe` instead of panning.
 */
export function useZoomPan(
  surfaceRef: RefObject<HTMLElement | null>,
  fitRef: RefObject<HTMLElement | null>,
  frameRef: RefObject<HTMLElement | null>,
  { aspect, onSwipe }: ZoomPanOptions,
) {
  const [view, setView] = useState<View>(FIT)
  const [phase, setPhaseState] = useState<ZoomPhase>('idle')
  const viewRef = useRef<View>(FIT)
  const phaseRef = useRef<ZoomPhase>('idle')
  const swipeRef = useRef(onSwipe)
  useEffect(() => {
    swipeRef.current = onSwipe
  })

  const setPhase = useCallback((next: ZoomPhase) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const apply = useCallback(
    (next: View, nextPhase: ZoomPhase) => {
      viewRef.current = next
      setView(next)
      setPhase(nextPhase)
    },
    [setPhase],
  )

  const layout = useCallback((): Layout | null => {
    const fit = fitRef.current
    if (!fit) return null
    const viewport = toBox(fit.getBoundingClientRect())
    return { viewport, content: containBox(viewport, aspect) }
  }, [fitRef, aspect])

  const zoomBy = useCallback(
    (factor: number) => {
      const current = layout()
      if (!current) return
      const { viewport } = current
      const center = { x: viewport.left + viewport.width / 2, y: viewport.top + viewport.height / 2 }
      apply(zoomAt(viewRef.current, viewRef.current.scale * factor, center, current), 'animate')
    },
    [layout, apply],
  )

  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy])
  const zoomOut = useCallback(() => zoomBy(1 / ZOOM_STEP), [zoomBy])
  const reset = useCallback(() => apply(FIT, 'animate'), [apply])

  useEffect(() => {
    const onResize = () => {
      const current = layout()
      if (current && viewRef.current.scale > 1) apply(clampView(viewRef.current, current), 'idle')
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [layout, apply])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return
    const pointers = new Map<number, Point>()
    let gesture: Gesture | null = null
    let tap: Tap | null = null
    let lastTap: Tap | null = null

    const begin = (afterPinch: boolean) => {
      const [a, b] = [...pointers.values()]
      const start = viewRef.current
      const current = layout()
      if (!a || !current) gesture = null
      else if (b) gesture = { kind: 'pinch', start, layout: current, from: pinchOf(a, b) }
      else gesture = { kind: start.scale > 1 || afterPinch ? 'pan' : 'swipe', start, layout: current, origin: a, time: performance.now() }
    }

    const freeze = () => {
      const frame = frameRef.current
      const current = layout()
      if (phaseRef.current !== 'animate' || !frame || !current) return
      const matrix = new DOMMatrix(getComputedStyle(frame).transform)
      apply(clampView({ scale: matrix.a, x: matrix.e, y: matrix.f }, current), 'gesture')
    }

    const onTap = (point: Point, down: number, up: number) => {
      const current = layout()
      if (current && isDoubleTap(lastTap, down, point)) {
        lastTap = null
        apply(doubleTapView(viewRef.current, point, current), 'animate')
        return
      }
      lastTap = { time: up, point }
      if (viewRef.current.scale === 1) apply(FIT, 'animate')
      else setPhase('idle')
    }

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const point = { x: event.clientX, y: event.clientY }
      pointers.set(event.pointerId, point)
      surface.setPointerCapture?.(event.pointerId)
      tap = pointers.size === 1 ? { time: performance.now(), point } : null
      freeze()
      begin(false)
    }

    const onMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return
      const point = { x: event.clientX, y: event.clientY }
      pointers.set(event.pointerId, point)
      if (tap && Math.hypot(point.x - tap.point.x, point.y - tap.point.y) > TAP_SLOP) tap = null
      if (!gesture) return
      if (gesture.kind === 'pinch') {
        const [a, b] = [...pointers.values()]
        apply(pinchView(gesture.start, gesture.from, pinchOf(a, b), gesture.layout), 'gesture')
      } else if (gesture.kind === 'pan') {
        apply(panView(gesture.start, point.x - gesture.origin.x, point.y - gesture.origin.y, gesture.layout), 'gesture')
      } else {
        apply({ scale: 1, x: gesture.start.x + (point.x - gesture.origin.x) * SWIPE_RESIST, y: 0 }, 'gesture')
      }
    }

    const finish = (event: PointerEvent, cancelled: boolean) => {
      if (!pointers.has(event.pointerId)) return
      const ended = gesture
      pointers.delete(event.pointerId)
      if (pointers.size > 0) {
        tap = null
        begin(ended?.kind === 'pinch' || ended?.kind === 'pan')
        return
      }
      gesture = null
      const time = performance.now()
      const point = { x: event.clientX, y: event.clientY }
      if (!cancelled && tap && time - tap.time < TAP_MS) {
        const down = tap.time
        tap = null
        onTap(point, down, time)
        return
      }
      tap = null
      if (ended?.kind === 'swipe') {
        const dx = point.x - ended.origin.x
        const dy = point.y - ended.origin.y
        const fast = Math.abs(dx) / Math.max(1, time - ended.time) > SWIPE_SPEED
        if (!cancelled && Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > SWIPE_DISTANCE || fast)) swipeRef.current()
        apply(FIT, 'animate')
      } else if (viewRef.current.scale < FIT_SNAP) {
        apply(FIT, 'animate')
      } else {
        setPhase('idle')
      }
    }

    const onUp = (event: PointerEvent) => finish(event, false)
    const onCancel = (event: PointerEvent) => finish(event, true)

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const current = layout()
      if (!current) return
      const lines = event.deltaMode === 1 ? 16 : 1
      const factor = Math.exp(-event.deltaY * lines * (event.ctrlKey ? 0.01 : 0.002))
      const point = { x: event.clientX, y: event.clientY }
      apply(zoomAt(viewRef.current, viewRef.current.scale * factor, point, current), 'idle')
    }

    surface.addEventListener('pointerdown', onDown)
    surface.addEventListener('pointermove', onMove)
    surface.addEventListener('pointerup', onUp)
    surface.addEventListener('pointercancel', onCancel)
    surface.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      surface.removeEventListener('pointerdown', onDown)
      surface.removeEventListener('pointermove', onMove)
      surface.removeEventListener('pointerup', onUp)
      surface.removeEventListener('pointercancel', onCancel)
      surface.removeEventListener('wheel', onWheel)
    }
  }, [surfaceRef, frameRef, layout, apply, setPhase])

  return { view, phase, zoomIn, zoomOut, reset }
}
