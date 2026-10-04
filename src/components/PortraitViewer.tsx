import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import type { Stage } from '../content/types'
import { portraitUrl } from '../content/loader'
import { springUi } from '../theme/motion'
import { heightLabel } from './heightLabel'
import { useOverlay } from './useOverlay'
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
const SWIPE_DISTANCE = 60
const SWIPE_VELOCITY = 400

export function PortraitViewer({ open, stage, initialSide = 'female', onClose }: PortraitViewerProps) {
  return createPortal(
    <AnimatePresence>
      {open && <ViewerPanel key="viewer" stage={stage} initialSide={initialSide} onClose={onClose} />}
    </AnimatePresence>,
    document.body,
  )
}

function ViewerPanel({ stage, initialSide, onClose }: Omit<PortraitViewerProps, 'open'> & { initialSide: PortraitSide }) {
  const [side, setSide] = useState<PortraitSide>(initialSide)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const toggle = () => setSide((current) => (current === 'female' ? 'male' : 'female'))
  useOverlay(panelRef, closeRef, onClose)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_DISTANCE || Math.abs(info.velocity.x) > SWIPE_VELOCITY) toggle()
  }

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
      <button ref={closeRef} type="button" className="viewer__close" aria-label="Close portraits" onClick={onClose}>
        <span aria-hidden="true">×</span>
      </button>

      <motion.div
        className="viewer__stage"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        onDragEnd={onDragEnd}
        onTap={toggle}
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={springUi}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={side}
            className="viewer__img"
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
      </motion.div>

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
              onClick={() => setSide(value)}
            >
              {side === value && (
                <motion.span layoutId="viewer-toggle-pill" className="viewer__toggle-pill" transition={springUi} />
              )}
              <span className="viewer__toggle-label">{LABEL[value]}</span>
            </button>
          ))}
        </div>
        <p className="viewer__hint faint small">
          <span>Swipe or tap to switch ·</span> <span>AI-generated reconstruction</span>
        </p>
      </div>
    </motion.div>
  )
}
