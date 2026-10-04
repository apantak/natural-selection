import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { GameContext, type GameApi } from '../app/gameContext'
import { stages } from '../content/loader'
import { computeResults, initialState, stageOutcome } from '../game/engine'
import type { GameState, StageVotes } from '../game/types'
import { End } from './End'

const renderShareCard = vi.hoisted(() => vi.fn())
const shareImage = vi.hoisted(() => vi.fn())

vi.mock('../share/shareCard', () => ({ renderShareCard, SHARE_FILENAME: 'card.png' }))
vi.mock('../share/share', () => ({ shareImage }))
vi.mock('canvas-confetti', () => ({ default: Object.assign(vi.fn(), { shapeFromText: vi.fn() }) }))

const players = [
  { id: 'p1', name: 'Dave' },
  { id: 'p2', name: 'Sue' },
  { id: 'p3', name: 'Mo' },
]

function gameState(votes: StageVotes[], endReason: GameState['endReason']): GameState {
  return { ...initialState(), screen: 'end', adultConfirmed: true, players, stageIndex: votes.length - 1, votes, endReason }
}

function renderEnd(state: GameState) {
  const dispatch = vi.fn()
  const api: GameApi = {
    state,
    dispatch,
    stages,
    stage: stages[state.stageIndex],
    outcome: stageOutcome(state, stages.length),
    results: computeResults(state),
  }
  render(
    <GameContext value={api}>
      <End />
    </GameContext>,
  )
  return dispatch
}

const played = gameState(
  [
    { p1: 'accept', p2: 'accept', p3: 'cutoff' },
    { p1: 'accept', p2: 'accept', p3: 'cutoff' },
    { p1: 'cutoff', p2: 'accept', p3: 'cutoff' },
  ],
  'host-ended',
)

describe('End', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    renderShareCard.mockImplementation(async ({ hideNames }: { hideNames: boolean }) => new Blob([String(hideNames)], { type: 'image/png' }))
    shareImage.mockResolvedValue('shared')
    URL.createObjectURL = vi.fn(() => `blob:${Math.random()}`)
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('reveals the group cutoff, the ranking and the crown', () => {
    renderEnd(played)
    expect(screen.getByRole('heading', { level: 2, name: stages[1].species })).toBeInTheDocument()
    expect(screen.getByText('The host called it after 3 stages.')).toBeInTheDocument()

    const rows = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(rows.map((r) => r.querySelector('.end-ranking__name')?.textContent)).toEqual(['Sue👑', 'Dave', 'Mo'])
    expect(rows[2]).toHaveTextContent('Rejected their own species')
    expect(rows[0]).toHaveTextContent(stages[2].species)

    expect(within(screen.getByRole('region', { name: 'Last one standing' })).getByText('Sue')).toBeInTheDocument()
  })

  it('handles a group that never got past Homo sapiens', () => {
    renderEnd(gameState([{ p1: 'cutoff', p2: 'cutoff', p3: 'cutoff' }], 'nobody-accepted'))
    expect(screen.getByText("You didn't even make it past Homo sapiens")).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Last one standing' })).toBeNull()
    expect(screen.getByText(new RegExp(`Not a single bone accepted at ${stages[0].species}`))).toBeInTheDocument()
  })

  it('names the out-of-stages ending', () => {
    renderEnd(gameState(stages.map(() => ({ p1: 'accept', p2: 'accept', p3: 'accept' })), 'out-of-stages'))
    expect(screen.getByText('You went all the way back 7 million years.')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Last one standing' })).getByText('Dave, Sue & Mo')).toBeInTheDocument()
  })

  it('plays again or starts a new game', () => {
    const dispatch = renderEnd(played)
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
    fireEvent.click(screen.getByRole('button', { name: /New game/ }))
    expect(dispatch.mock.calls).toEqual([[{ type: 'playAgain' }], [{ type: 'newGame' }]])
  })

  it('pre-renders the card and shares it straight from the tap', async () => {
    renderEnd(played)
    const share = screen.getByRole('button', { name: /Preparing the card/ })
    expect(share).toBeDisabled()

    await act(() => vi.runAllTimersAsync())
    expect(renderShareCard).toHaveBeenCalledWith(expect.objectContaining({ hideNames: false, players }))

    fireEvent.click(screen.getByRole('button', { name: /Share the results/ }))
    expect(shareImage).toHaveBeenCalledTimes(1)
    expect(await shareImage.mock.calls[0][0].text()).toBe('false')
    expect(shareImage.mock.calls[0][1]).toBe('card.png')
  })

  it('re-renders the card when names are hidden', async () => {
    renderEnd(played)
    await act(() => vi.runAllTimersAsync())

    const toggle = screen.getByRole('switch', { name: 'Hide names' })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /Preparing the card/ })).toBeDisabled()

    await act(() => vi.runAllTimersAsync())
    expect(renderShareCard).toHaveBeenLastCalledWith(expect.objectContaining({ hideNames: true }))
    fireEvent.click(screen.getByRole('button', { name: /Share the results/ }))
    expect(await shareImage.mock.calls[0][0].text()).toBe('true')
  })

  it('ignores a second share tap while the first share is still open', async () => {
    let finish: (result: string) => void = () => {}
    shareImage.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    renderEnd(played)
    await act(() => vi.runAllTimersAsync())

    const share = screen.getByRole('button', { name: /Share the results/ })
    fireEvent.click(share)
    fireEvent.click(share)
    expect(shareImage).toHaveBeenCalledTimes(1)
    expect(share).toBeDisabled()

    await act(async () => finish('shared'))
    expect(share).toBeEnabled()
  })

  it('tells the host when the file was downloaded instead', async () => {
    shareImage.mockResolvedValue('downloaded')
    renderEnd(played)
    await act(() => vi.runAllTimersAsync())
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Share the results/ }))
    })
    expect(screen.getByText('Card saved. Check your downloads.')).toBeInTheDocument()
  })
})
