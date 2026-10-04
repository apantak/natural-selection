import { AnimatePresence, motion } from 'motion/react'
import { nameFit } from './nameFit'
import { springPop, springUi } from '../theme/motion'
import './PlayerTile.css'

export interface PlayerTileProps {
  name: string
  selected: boolean
  onToggle?: () => void
  disabled?: boolean
  acceptLabel?: string
  cutoffLabel?: string
}

export function PlayerTile({ name, selected, onToggle, disabled, acceptLabel = 'Accepts', cutoffLabel = 'Cutoff' }: PlayerTileProps) {
  return (
    <motion.button
      type="button"
      className={`player-tile${selected ? ' player-tile--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={springUi}
    >
      <span className="player-tile__name" style={nameFit(name)}>
        {name}
      </span>
      <span className="player-tile__status">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={selected ? 'accept' : 'cutoff'}
            className="player-tile__chip"
            initial={{ opacity: 0, scale: 0.6, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -6 }}
            transition={springPop}
          >
            <span aria-hidden="true">{selected ? '🦴' : '👎'}</span>
            {selected ? acceptLabel : cutoffLabel}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
