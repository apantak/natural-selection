import { useState } from 'react'
import { AnimatePresence, type Variants } from 'motion/react'
import { useGame } from '../app/useGame'
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
  const [accepted, setAccepted] = useState<ReadonlySet<PlayerId>>(() => new Set())
  const eyebrow = `Stage ${state.stageIndex + 1} · ${stage.species}`

  const toggle = (id: PlayerId) =>
    setAccepted((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const submit = () => {
    const votes: StageVotes = Object.fromEntries(
      state.players.map((p) => [p.id, accepted.has(p.id) ? 'accept' : 'cutoff']),
    )
    dispatch({ type: 'submitVotes', votes })
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PresenceFrame key={step} variants={stepVariants} initial="initial" animate="enter" exit="exit">
        {step === 'countdown' && <VoteCountdown eyebrow={eyebrow} onDone={() => setStep('tally')} />}
        {step === 'tally' && (
          <VoteTally
            eyebrow={eyebrow}
            players={state.players}
            accepted={accepted}
            onToggle={toggle}
            onSubmit={submit}
            onBlindVote={() => setStep('countdown')}
          />
        )}
      </PresenceFrame>
    </AnimatePresence>
  )
}
