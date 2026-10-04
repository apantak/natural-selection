import { createContext, type Dispatch } from 'react'
import type { GameAction, GameResults, GameState } from '../game/types'
import type { StageOutcome } from '../game/engine'
import type { Stage } from '../content/types'

export interface GameApi {
  state: GameState
  dispatch: Dispatch<GameAction>
  stages: Stage[]
  stage: Stage
  outcome: StageOutcome
  results: GameResults
}

export const GameContext = createContext<GameApi | null>(null)
