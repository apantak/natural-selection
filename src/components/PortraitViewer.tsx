import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { Stage } from '../content/types'
import { portraitUrl } from '../content/loader'
import { springUi } from '../theme/motion'
import { heightLabel } from './heightLabel'
import { useOverlay } from './useOverlay'
import { MAX_SCALE, useZoomPan } from './useZoomPan'
import './PortraitViewer.css'

export type PortraitSide = 'female' | 'male'

export interface PortraitViewerProps {
  open: boolean
  stage: Stage
  initialSide?: PortraitSide
  onClose: () => void
}

const SIDES: PortraitSide[] = ['female', 'male']
const LABEL: Record<PortraitSide, string> = { female: 'Female', male: 'Male' }
const ASPECT = 1024 / 1536

export function PortraitViewer({ open, stage, initialSide = 'female', onClose }: PortraitViewerProps) {
  return createPortal(
    <AnimatePresence>
      {open && <ViewerPanel key="viewer" stage={stage} initialSide={initialSide} onClose={onClose} />}
    </AnimatePresence>,
    document.body,
  )
}

export function ZoomBadge() {
  return (
    <span className="zoom-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 20 20M10.5 8v5M8 10.5h5" />
      </svg>
    </span>
  )
}

function ViewerPanel({ stage, initialSide, onClose }: Omit<PortraitViewerProps, 'open'> & { initialSide: PortraitSide }) {
  const [side, setSide] = useState<PortraitSide>(initialSide)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  useOverlay(panelRef, closeRef, onClose)

  const switchSide = useCallback(() => setSide((current) => (current === 'female' ? 'male' : 'female')), [])
  const { view, phase, zoomIn, zoomOut, reset } = useZoomPan(surfaceRef, fitRef, frameRef, { aspect: ASPECT, onSwipe: switchSide })
  const zoomed = view.scale > 1
  const choose = (value: PortraitSide) => {
    setSide(value)
    reset()
  }

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const block = (event: WheelEvent) => event.preventDefault()
    panel.addEventListener('wheel', block, { passive: false })
    return () => panel.removeEventListener('wheel', block)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        switchSide()
        reset()
      } else if (event.key === '+' || event.key === '=') zoomIn()
      else if (event.key === '-' || event.key === '_') zoomOut()
      else if (event.key === '0') reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [switchSide, zoomIn, zoomOut, reset])

  return (
    <motion.div
      ref={panelRef}
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`${stage.species} portraits`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div ref={surfaceRef} className="viewer__surface" data-zoomed={zoomed}>
        <motion.div
          ref={fitRef}
          className="viewer__fit"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springUi}
        >
          <div
            ref={frameRef}
            className="figure-frame viewer__frame"
            data-phase={phase}
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
          >
            <AnimatePresence initial={false}>
              <motion.img
                key={side}
                className="figure-img viewer__img"
                src={portraitUrl(stage.images[side])}
                alt={`${stage.species}, ${LABEL[side].toLowerCase()} reconstruction`}
                width={1024}
                height={1536}
                draggable={false}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22 }}
              />
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className="viewer__bar">
        <div className="viewer__zoom" role="group" aria-label="Zoom">
          <button type="button" className="viewer__zoom-btn" aria-label="Zoom out" aria-disabled={!zoomed} onClick={zoomOut}>
            <span aria-hidden="true">−</span>
          </button>
          <button type="button" className="viewer__zoom-btn viewer__zoom-fit" aria-label="Fit to screen" aria-disabled={!zoomed} onClick={reset}>
            Fit
          </button>
          <button
            type="button"
            className="viewer__zoom-btn"
            aria-label="Zoom in"
            aria-disabled={view.scale >= MAX_SCALE}
            onClick={zoomIn}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <button ref={closeRef} type="button" className="viewer__close" aria-label="Close portraits" onClick={onClose}>
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="viewer__footer">
        <div className="viewer__caption">
          <p className="viewer__species display">{stage.species}</p>
          <p className="viewer__height display" aria-live="polite">
            {LABEL[side]} · {heightLabel(stage.heightMeters[side])}
          </p>
        </div>
        <div className="viewer__toggle" role="group" aria-label="Portrait">
          {SIDES.map((value) => (
            <button
              key={value}
              type="button"
              className="viewer__toggle-btn"
              aria-pressed={side === value}
              onClick={() => choose(value)}
            >
              {side === value && (
                <motion.span layoutId="viewer-toggle-pill" layoutDependency={side} className="viewer__toggle-pill" transition={springUi} />
              )}
              <span className="viewer__toggle-label">{LABEL[value]}</span>
            </button>
          ))}
        </div>
        <p className="viewer__hint faint small">
          <span>{zoomed ? 'Drag to look around ·' : 'Pinch or double-tap to zoom ·'}</span> <span>AI-generated reconstruction</span>
        </p>
      </div>
    </motion.div>
  )
}
