import { AnimatePresence, motion } from 'motion/react'
import { Button, PlayerTile, ScreenLayout } from '../../components'
import type { Player, PlayerId } from '../../game/types'
import { fadeUp, springPop, stagger } from '../../theme/motion'

interface TallyProps {
  eyebrow: string
  players: Player[]
  accepted: ReadonlySet<PlayerId>
  onToggle: (id: PlayerId) => void
  onSubmit: () => void
  onBlindVote: () => void
}

export function VoteTally({ eyebrow, players, accepted, onToggle, onSubmit, onBlindVote }: TallyProps) {
  const count = players.filter((p) => accepted.has(p.id)).length

  return (
    <ScreenLayout
      header={
        <>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="title">Who accepted the bone?</h1>
          <p className="muted">Go round the room and argue it out. Tap everyone who accepts. The rest are cutoffs.</p>
        </>
      }
      actions={
        <>
          <div className="tally" role="status">
            <div className="tally__pips" aria-hidden="true">
              {players.map((p) => (
                <motion.span
                  key={p.id}
                  className={`tally__pip${accepted.has(p.id) ? ' tally__pip--on' : ''}`}
                  animate={{ scale: accepted.has(p.id) ? 1.3 : 1 }}
                  transition={springPop}
                />
              ))}
            </div>
            <p className="tally__text" aria-hidden="true">
              <span className="tally__count">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={count}
                    initial={{ y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -14, opacity: 0 }}
                    transition={springPop}
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </span>{' '}
              of {players.length} accept the bone
            </p>
            <span className="visually-hidden">
              {count} of {players.length} accept the bone
            </span>
          </div>
          <Button block onClick={onSubmit}>
            Lock in votes
          </Button>
          <Button variant="ghost" size="md" onClick={onBlindVote}>
            Blind vote on three
          </Button>
        </>
      }
    >
      <motion.div className="vote-grid" variants={stagger(0.04, 0.04)} initial="hidden" animate="show">
        {players.map((p) => (
          <motion.div key={p.id} className="vote-grid__cell" variants={fadeUp}>
            <PlayerTile name={p.name} selected={accepted.has(p.id)} onToggle={() => onToggle(p.id)} />
          </motion.div>
        ))}
      </motion.div>
    </ScreenLayout>
  )
}
