import { motion } from 'motion/react'
import { fadeUp } from '../../theme/motion'

const NUMERALS = ['I', 'II', 'III', 'IV', 'V']

export function FactList({ facts }: { facts: string[] }) {
  return (
    <ol className="facts" aria-label="Facts">
      {facts.map((fact, i) => (
        <motion.li key={fact} className="facts__item" variants={fadeUp}>
          <span className="facts__numeral" aria-hidden="true">
            {NUMERALS[i] ?? i + 1}
          </span>
          <p className="facts__text">{fact}</p>
        </motion.li>
      ))}
    </ol>
  )
}
