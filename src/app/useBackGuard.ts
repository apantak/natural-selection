import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react'
import type { GameAction, Screen } from '../game/types'

const GUARD_KEY = 'wyatbGuard'
const QUIT_SCREENS: Screen[] = ['intro', 'vote', 'ceremony', 'end']

function onGuardEntry(): boolean {
  return (history.state as Record<string, unknown> | null)?.[GUARD_KEY] === true
}

function pushGuard() {
  history.pushState({ [GUARD_KEY]: true }, '')
}

export function useBackGuard(screen: Screen, dispatch: Dispatch<GameAction>) {
  const [quitOpen, setQuitOpen] = useState(false)
  const screenRef = useRef(screen)
  const unwinding = useRef(false)

  useEffect(() => {
    screenRef.current = screen
    if (screen !== 'home') {
      if (!onGuardEntry() && !unwinding.current) pushGuard()
      return
    }
    if (onGuardEntry() && !unwinding.current) {
      unwinding.current = true
      history.back()
    }
  }, [screen])

  useEffect(() => {
    const onPopState = () => {
      const current = screenRef.current
      if (unwinding.current) {
        unwinding.current = false
        if (current !== 'home') pushGuard()
        return
      }
      if (current === 'home') return
      if (QUIT_SCREENS.includes(current)) {
        pushGuard()
        setQuitOpen(true)
        return
      }
      dispatch({ type: 'goHome' })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [dispatch])

  const confirmQuit = useCallback(() => {
    setQuitOpen(false)
    dispatch({ type: 'newGame' })
  }, [dispatch])

  const cancelQuit = useCallback(() => setQuitOpen(false), [])

  return { quitOpen: quitOpen && QUIT_SCREENS.includes(screen), confirmQuit, cancelQuit }
}
