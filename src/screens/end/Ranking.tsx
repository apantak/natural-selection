import { motion } from 'motion/react'
import type { RankedPlayer } from '../../share/summary'
import { springUi } from '../../theme/motion'

interface RankingProps {
  ranking: RankedPlayer[]
  delay: number
  step: number
}

export function Ranking({ ranking, delay, step }: RankingProps) {
  return (
    <section className="card end-ranking" aria-labelledby="end-ranking-title">
      <h2 id="end-ranking-title" className="eyebrow">
        How far back would you go?
      </h2>
      <ol className="end-ranking__list">
        {ranking.map((row, i) => (
          <motion.li
            key={row.id}
            className={['end-ranking__row', row.crowned && 'end-ranking__row--crowned'].filter(Boolean).join(' ')}
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springUi, delay: delay + (ranking.length - 1 - i) * step }}
          >
            <span className="end-ranking__rank display" aria-label={`Rank ${row.rank}`}>
              {row.rank}
            </span>
            <span className="end-ranking__name">
              {row.name}
              {row.crowned && (
                <span className="end-ranking__crown" role="img" aria-label="Last one standing">
                  👑
                </span>
              )}
            </span>
            <span className={['end-ranking__cutoff display', row.cutoff === null && 'rose'].filter(Boolean).join(' ')}>
              {row.cutoff !== null && <span className="end-ranking__stage">Stage {row.cutoff + 1}</span>}
              {row.label}
            </span>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}
