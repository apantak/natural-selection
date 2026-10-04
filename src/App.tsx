import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, useIsPresent } from 'motion/react'
import { GameProvider } from './app/GameProvider'
import { GameContext } from './app/gameContext'
import { useBackGuard } from './app/useBackGuard'
import { useGame } from './app/useGame'
import { ConfirmDialog, PresenceFrame } from './components'
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

export default function App({ onUpdateSafe }: { onUpdateSafe?: (safe: boolean) => void }) {
  return (
    <MotionConfig reducedMotion="user">
      <GameProvider>
        <Shell onUpdateSafe={onUpdateSafe} />
      </GameProvider>
    </MotionConfig>
  )
}

function Shell({ onUpdateSafe }: { onUpdateSafe?: (safe: boolean) => void }) {
  const { state, dispatch } = useGame()
  const guard = useBackGuard(state.screen, dispatch)
  useEffect(() => onUpdateSafe?.(state.screen === 'home'), [onUpdateSafe, state.screen])
  const Current = SCREENS[state.screen]

  return (
    <>
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
        <PresenceFrame key={state.screen} variants={screenVariants} initial="initial" animate="enter" exit="exit">
          <FrozenWhileExiting>
            <Current />
          </FrozenWhileExiting>
        </PresenceFrame>
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

function FrozenWhileExiting({ children }: { children: ReactNode }) {
  const api = useGame()
  const isPresent = useIsPresent()
  const [held, setHeld] = useState(api)
  if (isPresent && held !== api) setHeld(api)
  return <GameContext value={isPresent ? api : held}>{children}</GameContext>
}
