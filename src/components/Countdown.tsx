import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { springPop } from '../theme/motion'
import './Countdown.css'

export interface CountdownProps {
  from?: number
  stepMs?: number
  finalLabel?: string
  onDone: () => void
}

export function Countdown({ from = 3, stepMs = 900, finalLabel = 'Vote!', onDone }: CountdownProps) {
  const [value, setValue] = useState(from)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (value < 0) {
      onDoneRef.current()
      return
    }
    const timer = window.setTimeout(() => setValue((current) => current - 1), value === 0 ? stepMs * 0.7 : stepMs)
    return () => window.clearTimeout(timer)
  }, [value, stepMs])

  const label = value > 0 ? String(value) : finalLabel

  return (
    <div className="countdown">
      <span className="visually-hidden" role="timer" aria-live="assertive">
        {value >= 0 ? label : ''}
      </span>
      <AnimatePresence mode="popLayout">
        {value >= 0 && (
          <motion.span
            key={value}
            className={`countdown__value${value === 0 ? ' countdown__value--final' : ''}`}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 1.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={springPop}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span
        key={`ring-${value}`}
        className="countdown__ring"
        aria-hidden="true"
        initial={{ opacity: 0.7, scale: 0.6 }}
        animate={{ opacity: 0, scale: 1.4 }}
        transition={{ duration: stepMs / 1000, ease: 'easeOut' }}
      />
    </div>
  )
}
