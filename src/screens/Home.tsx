import { motion } from 'motion/react'
import { useGame } from '../app/useGame'
import { Badge, Button, InstallHint, ScreenLayout } from '../components'
import { fadeUp, stagger } from '../theme/motion'
import './Home.css'

export function Home() {
  const { state, dispatch } = useGame()
  const confirmed = state.adultConfirmed

  return (
    <ScreenLayout
      className="home"
      actions={
        <>
          <motion.div layout className="home__gate">
            {confirmed ? (
              <Button block onClick={() => dispatch({ type: 'openSetup' })}>
                Start the show
              </Button>
            ) : (
              <Button block onClick={() => dispatch({ type: 'confirmAdult' })}>
                We're all adults
              </Button>
            )}
          </motion.div>
          <p className="home__note faint small center">
            {confirmed ? '3 to 8 players. One phone. No shame.' : 'This show is for players 18 and over.'}
          </p>
          <Button variant="ghost" size="md" onClick={() => dispatch({ type: 'openCredits' })}>
            Credits &amp; science sources
          </Button>
        </>
      }
    >
      <motion.div className="home__hero" variants={stagger(0.08, 0.08)} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="home__top">
          <span className="eyebrow">Tonight, live from the museum</span>
          <Badge />
        </motion.div>
        <motion.div variants={fadeUp} className="home__bone" aria-hidden="true">
          <span>🦴</span>
        </motion.div>
        <motion.h1 variants={fadeUp} className="title-hero home__title">
          Will You Accept This <span className="accent">Bone?</span>
        </motion.h1>
        <motion.div variants={fadeUp} className="rule" aria-hidden="true">
          ✦
        </motion.div>
        <motion.p variants={fadeUp} className="lede home__tagline">
          A dating show across 7 million years of human relatives.
        </motion.p>
      </motion.div>
      <InstallHint />
    </ScreenLayout>
  )
}
