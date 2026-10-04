import { useState } from 'react'
import { motion } from 'motion/react'
import { useGame } from '../app/useGame'
import { Button, PortraitViewer, ScreenLayout, type PortraitSide } from '../components'
import { fadeUp, stagger } from '../theme/motion'
import { FactList } from './play/FactList'
import { PortraitPair } from './play/PortraitPair'
import './play/StageIntro.css'

export function StageIntro() {
  const { state, stage, stages, dispatch } = useGame()
  const [viewer, setViewer] = useState<PortraitSide | null>(null)

  return (
    <ScreenLayout
      className="intro"
      header={
        <motion.div className="intro__head" variants={stagger(0.05, 0.08)} initial="hidden" animate="show">
          <motion.span variants={fadeUp} className="eyebrow">
            Stage {state.stageIndex + 1} of {stages.length}
          </motion.span>
          <motion.h1 variants={fadeUp} className="title-hero intro__species">
            {stage.species}
          </motion.h1>
          {stage.nickname && (
            <motion.p variants={fadeUp} className="intro__nickname accent display">
              “{stage.nickname}”
            </motion.p>
          )}
          <motion.div variants={fadeUp} className="rule intro__dates">
            {stage.lived.display}
          </motion.div>
        </motion.div>
      }
      actions={
        <Button block onClick={() => dispatch({ type: 'beginVote' })}>
          Collect the votes
        </Button>
      }
    >
      <motion.div className="intro__body" variants={stagger(0.3, 0.08)} initial="hidden" animate="show">
        <PortraitPair stage={stage} onOpen={setViewer} />
        <motion.p variants={fadeUp} className="faint small center intro__hint">
          Tap a portrait to show the room
        </motion.p>
        <motion.p variants={fadeUp} className="lede intro__description">
          {stage.description}
        </motion.p>
        <motion.div variants={fadeUp} className="rule" aria-hidden="true">
          ✦
        </motion.div>
        <FactList facts={stage.facts} />
      </motion.div>
      <PortraitViewer open={viewer !== null} stage={stage} initialSide={viewer ?? 'female'} onClose={() => setViewer(null)} />
    </ScreenLayout>
  )
}
