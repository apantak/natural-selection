import { useState } from 'react'
import { motion } from 'motion/react'
import { figureStyle, PortraitViewer, type PortraitSide } from '../../components'
import { portraitUrl } from '../../content/loader'
import type { Stage } from '../../content/types'
import { NO_GROUP_CUTOFF } from '../../share/summary'
import { springPop, springSoft } from '../../theme/motion'

interface GroupCutoffProps {
  stage: Stage | null
  index: number | null
  stageCount: number
}

const SIDES: { side: PortraitSide; label: string; tilt: number; from: number }[] = [
  { side: 'female', label: 'Female', tilt: -3, from: -40 },
  { side: 'male', label: 'Male', tilt: 3, from: 40 },
]

export function GroupCutoff({ stage, index, stageCount }: GroupCutoffProps) {
  const [viewer, setViewer] = useState<PortraitSide | null>(null)

  if (!stage || index === null) {
    return (
      <section className="end-group end-group--none" aria-labelledby="end-group-title">
        <span className="eyebrow">The group drew the line</span>
        <motion.span
          className="end-group__bone"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.4, rotate: -70 }}
          animate={{ opacity: 1, scale: 1, rotate: -24 }}
          transition={{ ...springPop, delay: 0.15 }}
        >
          🦴
        </motion.span>
        <motion.h2
          id="end-group-title"
          className="end-group__none title accent"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.3 }}
        >
          {NO_GROUP_CUTOFF}
        </motion.h2>
      </section>
    )
  }

  return (
    <section className="end-group" aria-labelledby="end-group-title">
      <span className="eyebrow">The group drew the line at</span>
      <div className="end-group__portraits">
        {SIDES.map(({ side, label, tilt, from }, i) => (
          <motion.button
            key={side}
            type="button"
            className="end-group__frame"
            aria-label={`View ${label.toLowerCase()} ${stage.species} portrait`}
            onClick={() => setViewer(side)}
            initial={{ opacity: 0, x: from, y: 24, rotate: tilt * 4, scale: 0.86 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: tilt, scale: 1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ ...springPop, delay: 0.12 + i * 0.08 }}
          >
            <span className="figure-frame end-group__figure">
              <img
                className="figure-img"
                style={figureStyle(stage.heightMeters[side])}
                src={portraitUrl(stage.images[side])}
                alt=""
                width={1024}
                height={1536}
                draggable={false}
                decoding="async"
              />
            </span>
          </motion.button>
        ))}
      </div>
      <motion.div
        className="end-group__caption"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSoft, delay: 0.32 }}
      >
        <h2 id="end-group-title" className="title end-group__species">
          {stage.species}
        </h2>
        {stage.nickname && <p className="end-group__nickname accent display">“{stage.nickname}”</p>}
        <p className="faint">
          Stage {index + 1} of {stageCount} · {stage.lived.display}
        </p>
      </motion.div>
      <PortraitViewer open={viewer !== null} stage={stage} initialSide={viewer ?? 'female'} onClose={() => setViewer(null)} />
    </section>
  )
}
