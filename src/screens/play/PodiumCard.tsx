import { motion } from 'motion/react'
import type { Vote } from '../../game/types'
import { springPop, springUi } from '../../theme/motion'

const FLY = { type: 'spring', stiffness: 260, damping: 28 } as const

export function PodiumCard({ name, vote, onNext }: { name: string; vote: Vote; onNext: () => void }) {
  const accept = vote === 'accept'
  return (
    <motion.button
      type="button"
      className={`podium-card podium-card--${vote}`}
      onClick={onNext}
      aria-label={`${name}: ${accept ? 'accepts the bone' : 'cutoff'}. Next`}
      initial={{ opacity: 0, y: 36, scale: 0.86 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0, rotate: 0, transition: springUi }}
      exit={
        accept
          ? { opacity: 0, x: 340, y: -24, rotate: 16, transition: FLY }
          : { opacity: 0, x: -300, y: 18, rotate: -12, scale: 0.92, transition: FLY }
      }
    >
      <span className="podium-card__name display">{name}</span>
      <motion.span
        className="podium-card__stamp"
        initial={{ opacity: 0, scale: 1.7, rotate: -14 }}
        animate={{ opacity: 1, scale: 1, rotate: -4 }}
        transition={{ ...springPop, delay: 0.16 }}
      >
        <span aria-hidden="true">{accept ? '🦴' : '👎'}</span>
        {accept ? 'Accepts the bone' : 'Cutoff'}
      </motion.span>
    </motion.button>
  )
}
