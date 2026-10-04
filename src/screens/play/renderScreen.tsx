import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { GameProvider } from '../../app/GameProvider'
import { initialState } from '../../game/engine'
import { saveState } from '../../game/persistence'
import type { GameState, StageVotes } from '../../game/types'

export const PLAYERS = [
  { id: 'p1', name: 'Ana' },
  { id: 'p2', name: 'Ben' },
  { id: 'p3', name: 'Cleo' },
]

export function votesFor(accepters: string[]): StageVotes {
  return Object.fromEntries(PLAYERS.map((p) => [p.id, accepters.includes(p.id) ? 'accept' : 'cutoff']))
}

export function renderScreen(ui: ReactNode, state: Partial<GameState>) {
  saveState({ ...initialState(), adultConfirmed: true, players: PLAYERS, ...state })
  return render(<GameProvider>{ui}</GameProvider>)
}
