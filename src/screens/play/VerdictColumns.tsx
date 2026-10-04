import { motion } from 'motion/react'
import type { Player } from '../../game/types'
import { springPop } from '../../theme/motion'

interface ColumnsProps {
  cutoff: Player[]
  accepted: Player[]
}

export function VerdictColumns({ cutoff, accepted }: ColumnsProps) {
  return (
    <div className="verdict-columns">
      <Column title="Cutoff" tone="cutoff" players={cutoff} />
      <Column title="Accepted" tone="accept" players={accepted} />
    </div>
  )
}

function Column({ title, tone, players }: { title: string; tone: 'accept' | 'cutoff'; players: Player[] }) {
  const from = tone === 'accept' ? -36 : 36
  return (
    <section className={`verdict-column verdict-column--${tone}`} aria-label={title}>
      <h2 className="verdict-column__title">
        <span>{title}</span>
        <span className="verdict-column__count">{players.length}</span>
      </h2>
      {players.length === 0 && (
        <span className="verdict-column__empty" aria-hidden="true">
          —
        </span>
      )}
      <ul className="verdict-column__list">
        {players.map((p) => (
          <motion.li
            key={p.id}
            className="verdict-column__chip"
            initial={{ opacity: 0, x: from, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ ...springPop, delay: 0.12 }}
          >
            {tone === 'accept' && <span aria-hidden="true">🦴 </span>}
            {p.name}
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
