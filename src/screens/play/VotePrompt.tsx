import { motion } from 'motion/react'
import { Button, Countdown, ScreenLayout } from '../../components'
import { fadeUp, springPop, stagger } from '../../theme/motion'

interface PromptProps {
  eyebrow: string
  onCount: () => void
  onSkip: () => void
}

export function VotePrompt({ eyebrow, onCount, onSkip }: PromptProps) {
  return (
    <ScreenLayout
      centered
      actions={
        <>
          <Button block onClick={onCount}>
            Count us in
          </Button>
          <Button variant="ghost" size="md" onClick={onSkip}>
            Skip countdown
          </Button>
        </>
      }
    >
      <motion.div className="vote-prompt" variants={stagger(0.05, 0.1)} initial="hidden" animate="show">
        <motion.span variants={fadeUp} className="eyebrow">
          {eyebrow}
        </motion.span>
        <motion.h1 variants={fadeUp} className="title-hero">
          On <span className="accent">three</span>
        </motion.h1>
        <div className="vote-prompt__choices">
          <Choice emoji="👍" label="accept the bone" tone="accept" />
          <Choice emoji="👎" label="cutoff" tone="cutoff" />
        </div>
        <motion.p variants={fadeUp} className="muted vote-prompt__note">
          Everyone votes at once. Yes, even if you bailed last round.
        </motion.p>
      </motion.div>
    </ScreenLayout>
  )
}

function Choice({ emoji, label, tone }: { emoji: string; label: string; tone: 'accept' | 'cutoff' }) {
  return (
    <motion.div variants={fadeUp} className={`vote-choice vote-choice--${tone}`}>
      <motion.span
        className="vote-choice__emoji"
        aria-hidden="true"
        initial={{ scale: 0.4, rotate: tone === 'accept' ? -20 : 20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...springPop, delay: tone === 'accept' ? 0.3 : 0.42 }}
      >
        {emoji}
      </motion.span>
      <span className="vote-choice__label display">{label}</span>
    </motion.div>
  )
}

export function VoteCountdown({ eyebrow, onDone }: { eyebrow: string; onDone: () => void }) {
  return (
    <ScreenLayout centered>
      <div className="vote-prompt">
        <span className="eyebrow">{eyebrow}</span>
        <Countdown onDone={onDone} finalLabel="VOTE!" />
        <p className="muted vote-prompt__note">👍 accept the bone · 👎 cutoff</p>
      </div>
    </ScreenLayout>
  )
}
