import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { computeResults, createReducer, initialState, stageOutcome } from '../game/engine'
import { loadState, saveState } from '../game/persistence'
import type { GameState } from '../game/types'
import { stages } from '../content/loader'
import { GameContext, type GameApi } from './gameContext'

const reducer = createReducer(stages.length)

function init(): GameState {
  const saved = loadState()
  const fits = saved && saved.stageIndex < stages.length && saved.votes.length <= stages.length
  return fits ? saved : initialState()
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => {
    saveState(state)
  }, [state])

  const api = useMemo<GameApi>(
    () => ({
      state,
      dispatch,
      stages,
      stage: stages[state.stageIndex],
      outcome: stageOutcome(state, stages.length),
      results: computeResults(state),
    }),
    [state],
  )

  return <GameContext value={api}>{children}</GameContext>
}
