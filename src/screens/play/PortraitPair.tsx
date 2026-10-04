import { useId } from 'react'
import { motion, type Variants } from 'motion/react'
import type { Stage } from '../../content/types'
import { portraitUrl } from '../../content/loader'
import { heightLabel, type PortraitSide } from '../../components'
import { fadeUp, springSoft } from '../../theme/motion'

const SIDES: PortraitSide[] = ['female', 'male']
const LABEL: Record<PortraitSide, string> = { female: 'Female', male: 'Male' }

const frame: Variants = {
  hidden: (side: PortraitSide) => ({ opacity: 0, y: 28, scale: 0.92, rotate: side === 'female' ? -4 : 4 }),
  show: (side: PortraitSide) => ({ opacity: 1, y: 0, scale: 1, rotate: side === 'female' ? -1.5 : 1.5, transition: springSoft }),
}

export function PortraitPair({ stage, onOpen }: { stage: Stage; onOpen: (side: PortraitSide) => void }) {
  const id = useId()
  return (
    <div className="portraits">
      {SIDES.map((side) => (
        <div key={side} className="portraits__item">
          <motion.button
            type="button"
            className="portraits__frame"
            custom={side}
            variants={frame}
            whileTap={{ scale: 0.96 }}
            onClick={() => onOpen(side)}
            aria-label={`Show the ${LABEL[side].toLowerCase()} portrait fullscreen`}
            aria-describedby={`${id}-${side}`}
          >
            <img
              className="portraits__img"
              src={portraitUrl(stage.images[side])}
              alt={`${stage.species}, ${LABEL[side].toLowerCase()} reconstruction`}
              width={1024}
              height={1536}
              draggable={false}
              decoding="async"
            />
            <span className="portraits__label">{LABEL[side]}</span>
          </motion.button>
          <motion.p id={`${id}-${side}`} variants={fadeUp} className="portraits__height display">
            {heightLabel(stage.heightMeters[side])}
          </motion.p>
        </div>
      ))}
    </div>
  )
}
