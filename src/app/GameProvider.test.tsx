import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { loadState } from '../game/persistence'
import { GameProvider } from './GameProvider'
import type { GameApi } from './gameContext'
import { useGame } from './useGame'

function Probe({ onApi }: { onApi: (api: GameApi) => void }) {
  onApi(useGame())
  return null
}

function mount() {
  let latest: GameApi | null = null
  const view = render(
    <GameProvider>
      <Probe onApi={(api) => (latest = api)} />
    </GameProvider>,
  )
  return { api: () => latest!, unmount: view.unmount }
}

function startThreePlayerGame(api: () => GameApi) {
  act(() => api().dispatch({ type: 'confirmAdult' }))
  act(() => api().dispatch({ type: 'openSetup' }))
  for (const name of ['Ana', 'Ben', 'Cleo']) act(() => api().dispatch({ type: 'addPlayer', name }))
  act(() => api().dispatch({ type: 'startGame' }))
}

describe('GameProvider persistence', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(cleanup)

  it('starts from the initial state when storage is empty', () => {
    const { api } = mount()
    expect(api().state.screen).toBe('home')
    expect(api().state.players).toEqual([])
  })

  it('saves every change to sessionStorage', () => {
    const { api } = mount()
    act(() => api().dispatch({ type: 'confirmAdult' }))
    act(() => api().dispatch({ type: 'openSetup' }))
    act(() => api().dispatch({ type: 'addPlayer', name: 'Ana' }))
    expect(loadState()).toMatchObject({ screen: 'setup', adultConfirmed: true, players: [{ name: 'Ana' }] })
  })

  it('restores a saved game after a reload', () => {
    const first = mount()
    startThreePlayerGame(first.api)
    first.unmount()

    const second = mount()
    expect(second.api().state.screen).toBe('intro')
    expect(second.api().state.players.map((p) => p.name)).toEqual(['Ana', 'Ben', 'Cleo'])
    expect(second.api().stage).toBe(second.api().stages[0])
  })

  it('ignores a saved game that points past the last stage', () => {
    const first = mount()
    startThreePlayerGame(first.api)
    first.unmount()
    const saved = JSON.parse(sessionStorage.getItem(sessionStorage.key(0)!)!)
    saved.state.stageIndex = first.api().stages.length
    sessionStorage.setItem(sessionStorage.key(0)!, JSON.stringify(saved))

    const second = mount()
    expect(second.api().state.screen).toBe('home')
  })

  it('derives outcome and results from the current state', () => {
    const { api } = mount()
    startThreePlayerGame(api)
    act(() => api().dispatch({ type: 'beginVote' }))
    const [ana] = api().state.players
    act(() => api().dispatch({ type: 'submitVotes', votes: { [ana.id]: 'accept' } }))
    expect(api().outcome.loneHoldout).toBe(true)
    expect(api().results.lastStanding).toEqual([ana.id])
  })
})
