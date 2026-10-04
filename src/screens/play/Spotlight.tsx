import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '../../components'
import { springSoft } from '../../theme/motion'

interface SpotlightProps {
  open: boolean
  name: string
  onClose: () => void
}

export function Spotlight({ open, name, onClose }: SpotlightProps) {
  return createPortal(
    <AnimatePresence>{open && <SpotlightPanel key="spotlight" name={name} onClose={onClose} />}</AnimatePresence>,
    document.body,
  )
}

function SpotlightPanel({ name, onClose }: Omit<SpotlightProps, 'open'>) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const id = useId()

  useEffect(() => {
    buttonRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { ...springSoft, delay } },
  })

  return (
    <motion.div
      className="spotlight"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-name ${id}-line`}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.55, ease: 'easeOut', delay: 0.25 }}
    >
      <motion.div
        className="spotlight__cone"
        aria-hidden="true"
        initial={{ opacity: 0, scaleY: 0.2 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: 0.7 }}
      />
      <motion.div
        className="spotlight__pool"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.8 }}
      />
      <div className="spotlight__content">
        <motion.span className="eyebrow" {...reveal(0.9)}>
          Lone holdout
        </motion.span>
        <motion.h2 id={`${id}-name`} className="title-hero spotlight__name" {...reveal(1)}>
          {name},
        </motion.h2>
        <motion.p id={`${id}-line`} className="lede spotlight__line" {...reveal(1.25)}>
          you're the last one holding a bone. Defend yourself.
        </motion.p>
        <motion.div {...reveal(1.6)}>
          <Button ref={buttonRef} variant="secondary" size="md" onClick={onClose}>
            Hear them out
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
