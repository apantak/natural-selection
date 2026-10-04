import type { ComponentType } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { GameProvider } from './app/GameProvider'
import { useBackGuard } from './app/useBackGuard'
import { useGame } from './app/useGame'
import { ConfirmDialog } from './components'
import type { Screen } from './game/types'
import { Ceremony } from './screens/Ceremony'
import { Credits } from './screens/Credits'
import { End } from './screens/End'
import { Home } from './screens/Home'
import { Setup } from './screens/Setup'
import { StageIntro } from './screens/StageIntro'
import { Vote } from './screens/Vote'
import { screenVariants } from './theme/motion'

const SCREENS: Record<Screen, ComponentType> = {
  home: Home,
  setup: Setup,
  credits: Credits,
  intro: StageIntro,
  vote: Vote,
  ceremony: Ceremony,
  end: End,
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <GameProvider>
        <Shell />
      </GameProvider>
    </MotionConfig>
  )
}

function Shell() {
  const { state, dispatch } = useGame()
  const guard = useBackGuard(state.screen, dispatch)
  const Current = SCREENS[state.screen]

  return (
    <>
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.div key={state.screen} variants={screenVariants} initial="initial" animate="enter" exit="exit">
          <Current />
        </motion.div>
      </AnimatePresence>
      <ConfirmDialog
        open={guard.quitOpen}
        title="Quit game?"
        message="The votes so far will be lost."
        confirmLabel="Quit game"
        cancelLabel="Keep playing"
        destructive
        onConfirm={guard.confirmQuit}
        onCancel={guard.cancelQuit}
      />
    </>
  )
}
