import { useId } from 'react'
import { motion } from 'motion/react'
import type { StageOutcome } from '../../game/engine'
import type { Player } from '../../game/types'
import { fadeUp, springPop, stagger } from '../../theme/motion'
import { joinNames } from './names'

interface VerdictProps {
  outcome: StageOutcome
  accepted: Player[]
  wentOut: Player[]
  total: number
  allIn: boolean
}

function verdictCopy({ outcome, accepted, total, allIn }: VerdictProps): { eyebrow: string; headline: string } {
  if (outcome.nobody) return { eyebrow: 'Total rejection', headline: 'Nobody accepted the bone.' }
  if (outcome.unanimous) {
    return { eyebrow: 'Unanimous', headline: allIn ? 'Everyone accepted the bone.' : 'Everyone still in accepted the bone.' }
  }
  if (outcome.loneHoldout) return { eyebrow: 'Lone holdout', headline: `Only ${accepted[0].name} accepted the bone.` }
  return { eyebrow: 'The verdict', headline: `${accepted.length} of ${total} accepted the bone.` }
}

function outCopy(wentOut: Player[]): string {
  return `${joinNames(wentOut.map((p) => p.name))} ${wentOut.length === 1 ? 'is' : 'are'} out.`
}

export function VerdictHeadline(props: VerdictProps) {
  const { eyebrow, headline } = verdictCopy(props)
  const showOut = !props.outcome.nobody && props.wentOut.length > 0
  return (
    <motion.div
      className="verdict"
      initial={{ opacity: 0, scale: 0.88, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...springPop, delay: 0.15 }}
    >
      <span className={`eyebrow${props.outcome.nobody ? ' verdict__eyebrow--rose' : ''}`}>{eyebrow}</span>
      <p className="verdict__headline display" role="status">
        {headline}
      </p>
      {showOut && <p className="verdict__out">{outCopy(props.wentOut)}</p>}
    </motion.div>
  )
}

interface FinaleProps {
  accepted: Player[]
  wentOut: Player[]
  punchline?: string
}

export function FinalePrompts({ accepted, wentOut, punchline }: FinaleProps) {
  const nobody = accepted.length === 0
  const named = nobody ? wentOut : accepted
  const headingId = useId()
  const question = nobody ? 'what was the dealbreaker?' : 'tell the room what you saw in them.'

  return (
    <motion.div className="finale" variants={stagger(0.45, 0.18)} initial="hidden" animate="show">
      {named.length > 0 && (
        <motion.section variants={fadeUp} className="card justify" aria-labelledby={headingId}>
          <h2 id={headingId} className="eyebrow">{named.length === 1 ? 'Justify yourself' : 'Justify yourselves'}</h2>
          <p className="justify__text display">
            <span className="accent">{joinNames(named.map((p) => p.name))}</span>, {question}
          </p>
        </motion.section>
      )}
      {punchline && (
        <motion.figure variants={fadeUp} className="punchline">
          <blockquote className="punchline__quote display">“{punchline}”</blockquote>
        </motion.figure>
      )}
    </motion.div>
  )
}
