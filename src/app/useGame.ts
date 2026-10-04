import { useContext } from 'react'
import { GameContext, type GameApi } from './gameContext'

export function useGame(): GameApi {
  const api = useContext(GameContext)
  if (!api) throw new Error('useGame must be used inside <GameProvider>')
  return api
}
