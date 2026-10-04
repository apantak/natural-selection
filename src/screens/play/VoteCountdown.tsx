import { Countdown, ScreenLayout } from '../../components'

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
