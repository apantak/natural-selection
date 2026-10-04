import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useGame } from '../app/useGame'
import { Button, ScreenLayout } from '../components'
import { endReasonLine, summarize } from '../share/summary'
import { fadeUp, springSoft, stagger } from '../theme/motion'
import { Crown } from './end/Crown'
import { GroupCutoff } from './end/GroupCutoff'
import { Ranking } from './end/Ranking'
import { SharePanel } from './end/SharePanel'
import { useDelayedBurst } from './end/useDelayedBurst'
import { useShareCard } from './end/useShareCard'
import './end/End.css'

const RANKING_DELAY = 0.45
const RANKING_STEP = 0.09

export function End() {
  const { state, results, stages, dispatch } = useGame()
  const [hideNames, setHideNames] = useState(false)
  const summary = useMemo(() => summarize({ results, players: state.players, stages, hideNames: false }), [results, state.players, stages])
  const crownDelay = RANKING_DELAY + summary.ranking.length * RANKING_STEP + 0.1
  const card = useShareCard({ results, players: state.players, stages, hideNames }, (crownDelay + 0.6) * 1000)
  const hasCrown = summary.crowned.length > 0
  useDelayedBurst(hasCrown ? 'bone' : 'dust', (hasCrown ? crownDelay + 0.08 : 0.4) * 1000)
  const reason = endReasonLine(state.endReason, results.stagesPlayed, stages)

  return (
    <ScreenLayout
      className="end"
      header={
        <motion.div className="stack-sm center" variants={stagger(0, 0.06)} initial="hidden" animate="show">
          <motion.span variants={fadeUp} className="eyebrow">
            Final bone count
          </motion.span>
          <motion.h1 variants={fadeUp} className="title">
            That's the <span className="accent">show.</span>
          </motion.h1>
          {reason && (
            <motion.p variants={fadeUp} className="lede">
              {reason}
            </motion.p>
          )}
        </motion.div>
      }
      actions={
        <>
          <Button block onClick={() => dispatch({ type: 'playAgain' })}>
            Play again
          </Button>
          <Button variant="ghost" size="md" onClick={() => dispatch({ type: 'newGame' })}>
            New game, new players
          </Button>
        </>
      }
    >
      <GroupCutoff stage={summary.group} index={summary.groupIndex} stageCount={stages.length} />
      {hasCrown && <Crown names={summary.crowned} delay={crownDelay} />}
      <Ranking ranking={summary.ranking} delay={RANKING_DELAY} step={RANKING_STEP} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSoft, delay: crownDelay + 0.2 }}>
        <SharePanel
          blob={card.blob}
          previewUrl={card.previewUrl}
          failed={card.failed}
          hideNames={hideNames}
          onHideNamesChange={setHideNames}
        />
      </motion.div>
    </ScreenLayout>
  )
}
