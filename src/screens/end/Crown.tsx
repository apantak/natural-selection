import { motion } from 'motion/react'
import { joinNames } from '../../share/summary'
import { springPop } from '../../theme/motion'

interface CrownProps {
  names: string[]
  delay: number
}

export function Crown({ names, delay }: CrownProps) {
  return (
    <motion.section
      className="card end-crown"
      aria-label="Last one standing"
      initial={{ opacity: 0, scale: 0.7, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...springPop, delay }}
    >
      <motion.span
        className="end-crown__icon"
        aria-hidden="true"
        initial={{ y: -60, rotate: -30, opacity: 0 }}
        animate={{ y: 0, rotate: -8, opacity: 1 }}
        transition={{ ...springPop, delay: delay + 0.12 }}
      >
        👑
      </motion.span>
      <span className="eyebrow">Last one standing</span>
      <p className="end-crown__names display">{joinNames(names)}</p>
      <p className="faint">{names.length > 1 ? 'A shared crown. Nobody blinked first.' : 'Still holding a bone when everyone else let go.'}</p>
    </motion.section>
  )
}
