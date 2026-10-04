import { useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button, nameFit, ScreenLayout, VoteChoice } from '../../components'
import type { Player, PlayerId, StageVotes } from '../../game/types'
import { fadeUp, springPop, springUi, stagger } from '../../theme/motion'
import { joinNames } from './names'

export interface OutPlayer extends Player {
  since: number
}

interface TallyProps {
  eyebrow: string
  players: Player[]
  out: OutPlayer[]
  choices: StageVotes
  onChoose: (id: PlayerId, vote: StageVotes[PlayerId]) => void
  onSubmit: () => void
  onBlindVote: () => void
}

function tallyStatus(players: Player[], choices: StageVotes): { text: string; tone: string } {
  const undecided = players.filter((p) => !choices[p.id]).length
  if (undecided > 0) return { text: `${undecided} still to decide`, tone: '' }
  const cut = players.filter((p) => choices[p.id] === 'cutoff')
  if (cut.length === 0) return { text: 'Everyone stays in', tone: ' tally__text--done' }
  const text =
    cut.length === players.length && players.length > 1
      ? 'Everyone goes out'
      : `${joinNames(cut.map((p) => p.name))} ${cut.length === 1 ? 'goes' : 'go'} out`
  return { text, tone: ' tally__text--cut' }
}

export function VoteTally({ eyebrow, players, out, choices, onChoose, onSubmit, onBlindVote }: TallyProps) {
  const undecided = players.filter((p) => !choices[p.id]).length
  const status = tallyStatus(players, choices)

  return (
    <ScreenLayout
      header={
        <>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="title">Who accepted the bone?</h1>
          <p className="muted">Go round the room and argue it out. Mark each player Accept or Cut off.</p>
          <p className="vote-hint">
            <span aria-hidden="true">✂️ </span>Cut off is final. That player sits out the rest of the game.
          </p>
        </>
      }
      actions={
        <>
          <div className="tally" role="status">
            <div className="tally__pips" aria-hidden="true">
              {players.map((p) => (
                <motion.span
                  key={p.id}
                  className={`tally__pip${choices[p.id] ? ` tally__pip--${choices[p.id]}` : ''}`}
                  animate={{ scale: choices[p.id] ? 1.3 : 1 }}
                  transition={springPop}
                />
              ))}
            </div>
            <p className={`tally__text${status.tone}`}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={status.text}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={springPop}
                >
                  {status.text}
                </motion.span>
              </AnimatePresence>
            </p>
          </div>
          <Button block disabled={undecided > 0} onClick={onSubmit}>
            Lock in votes
          </Button>
          <Button variant="ghost" size="md" onClick={onBlindVote}>
            Blind vote on three
          </Button>
        </>
      }
    >
      <motion.div className="vote-list" variants={stagger(0.04, 0.04)} initial="hidden" animate="show">
        {players.map((p) => (
          <motion.div key={p.id} variants={fadeUp}>
            <VoteChoice name={p.name} value={choices[p.id]} onChange={(vote) => onChoose(p.id, vote)} />
          </motion.div>
        ))}
      </motion.div>
      {out.length > 0 && <OutList players={out} delay={0.08 + players.length * 0.04} />}
    </ScreenLayout>
  )
}

function OutList({ players, delay }: { players: OutPlayer[]; delay: number }) {
  const headingId = useId()
  return (
    <motion.section
      className="vote-out"
      aria-labelledby={headingId}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springUi, delay }}
    >
      <h2 className="vote-out__title">
        <span id={headingId}>Out</span>
        <span className="vote-out__note">Heckling only</span>
      </h2>
      <ul className="vote-out__list">
        {players.map((p) => (
          <li key={p.id} className="vote-out__chip">
            <span className="vote-out__name" style={nameFit(p.name)}>
              {p.name}
            </span>
            <span className="vote-out__since">Out since stage {p.since}</span>
          </li>
        ))}
      </ul>
    </motion.section>
  )
}
