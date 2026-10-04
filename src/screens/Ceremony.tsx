import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useGame } from '../app/useGame'
import { BoneBurst, Button, ScreenLayout, useInputLock } from '../components'
import { activePlayers } from '../game/engine'
import { fadeUp, stagger } from '../theme/motion'
import { FinalePrompts, VerdictHeadline } from './play/Finale'
import { PodiumCard } from './play/PodiumCard'
import { Spotlight } from './play/Spotlight'
import { useReveal } from './play/useReveal'
import { VerdictColumns } from './play/VerdictColumns'
import './play/Ceremony.css'

const ACTIONS_DELAY = 0.5
export const ACTIONS_LOCK_MS = (ACTIONS_DELAY + 0.5) * 1000

export function Ceremony() {
  const { state, stage, outcome, dispatch } = useGame()
  const { stageIndex } = state
  const votes = state.votes[stageIndex] ?? {}
  const players = activePlayers(state, stageIndex)
  const { revealed, done, next, skip } = useReveal(players.length)
  const [spotlightSeen, setSpotlightSeen] = useState(false)
  const closeSpotlight = useCallback(() => setSpotlightSeen(true), [])
  const actionsLocked = useInputLock(done, ACTIONS_LOCK_MS)

  const shown = players.slice(0, revealed)
  const current = done ? null : players[revealed]
  const accepted = players.filter((p) => outcome.accepters.includes(p.id))
  const wentOut = players.filter((p) => outcome.wentOut.includes(p.id))

  return (
    <ScreenLayout
      className="ceremony"
      header={
        <>
          <span className="eyebrow">
            Stage {stageIndex + 1} · {stage.species}
          </span>
          <h1 className="title">The Bone Ceremony</h1>
        </>
      }
      actions={
        done ? (
          <motion.div
            className="ceremony__actions"
            data-locked={actionsLocked || undefined}
            variants={stagger(ACTIONS_DELAY, 0.08)}
            initial="hidden"
            animate="show"
          >
            {outcome.canContinue ? (
              <>
                <motion.div variants={fadeUp}>
                  <Button block onClick={() => dispatch({ type: 'continue' })}>
                    Continue to stage {stageIndex + 2}
                  </Button>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Button block variant="secondary" onClick={() => dispatch({ type: 'endHere' })}>
                    End here
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div variants={fadeUp}>
                <Button block onClick={() => dispatch({ type: 'endHere' })}>
                  See the results
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <Button variant="ghost" size="md" onClick={skip}>
            Skip the suspense
          </Button>
        )
      }
    >
      <div className="podium">
        <AnimatePresence>
          {current ? (
            <PodiumCard
              key={current.id}
              name={current.name}
              vote={votes[current.id] === 'accept' ? 'accept' : 'cutoff'}
              onNext={next}
            />
          ) : (
            <VerdictHeadline
              key="verdict"
              outcome={outcome}
              accepted={accepted}
              wentOut={wentOut}
              total={players.length}
              allIn={players.length === state.players.length}
              species={stage.species}
            />
          )}
        </AnimatePresence>
      </div>
      <VerdictColumns
        cutoff={shown.filter((p) => votes[p.id] !== 'accept')}
        accepted={shown.filter((p) => votes[p.id] === 'accept')}
      />
      {done && <FinalePrompts accepted={accepted} wentOut={wentOut} punchline={stage.punchline} />}
      <BoneBurst variant="bone" play={done && outcome.unanimous} />
      <BoneBurst variant="dust" play={done && outcome.nobody} />
      <Spotlight
        open={done && outcome.loneHoldout && !spotlightSeen}
        name={accepted[0]?.name ?? ''}
        onClose={closeSpotlight}
      />
    </ScreenLayout>
  )
}
