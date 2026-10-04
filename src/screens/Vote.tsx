import { useState } from 'react'
import { AnimatePresence, type Variants } from 'motion/react'
import { useGame } from '../app/useGame'
import { activePlayers, eliminatedAt } from '../game/engine'
import { PresenceFrame } from '../components'
import type { PlayerId, StageVotes } from '../game/types'
import { VoteCountdown } from './play/VoteCountdown'
import { VoteTally } from './play/VoteTally'
import './play/Vote.css'

type Step = 'tally' | 'countdown'

const stepVariants: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  enter: { opacity: 1, scale: 1, transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } },
  exit: { opacity: 0, scale: 1.03, transition: { duration: 0.14, ease: 'easeIn' } },
}

export function Vote() {
  const { state, stage, dispatch } = useGame()
  const [step, setStep] = useState<Step>('tally')
  const [choices, setChoices] = useState<StageVotes>({})
  const eyebrow = `Stage ${state.stageIndex + 1} · ${stage.species}`
  const active = activePlayers(state)
  const out = state.players
    .filter((p) => !active.includes(p))
    .map((p) => ({ ...p, since: (eliminatedAt(state, p.id) ?? 0) + 1 }))

  const choose = (id: PlayerId, vote: StageVotes[PlayerId]) => setChoices((current) => ({ ...current, [id]: vote }))

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PresenceFrame key={step} variants={stepVariants} initial="initial" animate="enter" exit="exit">
        {step === 'countdown' && <VoteCountdown eyebrow={eyebrow} onDone={() => setStep('tally')} />}
        {step === 'tally' && (
          <VoteTally
            eyebrow={eyebrow}
            players={active}
            out={out}
            choices={choices}
            onChoose={choose}
            onSubmit={() => dispatch({ type: 'submitVotes', votes: choices })}
            onBlindVote={() => setStep('countdown')}
          />
        )}
      </PresenceFrame>
    </AnimatePresence>
  )
}
