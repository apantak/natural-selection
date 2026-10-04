import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { fireBoneBurst, fireDustBurst } from '../components/bursts'
import { stages } from '../content/loader'
import { loadState } from '../game/persistence'
import { ACTIONS_LOCK_MS, Ceremony } from './Ceremony'
import { renderScreen, votesFor } from './play/renderScreen'

vi.mock('../components/bursts', () => ({ fireBoneBurst: vi.fn(), fireDustBurst: vi.fn() }))

const LAST = stages.length - 1

function renderCeremony(accepters: string[], stageIndex = 0) {
  const votes = Array.from({ length: stageIndex + 1 }, () => votesFor(['p1', 'p2', 'p3']))
  votes[stageIndex] = votesFor(accepters)
  renderScreen(<Ceremony />, { screen: 'ceremony', stageIndex, votes })
}

function renderRounds(rounds: string[][]) {
  renderScreen(<Ceremony />, { screen: 'ceremony', stageIndex: rounds.length - 1, votes: rounds.map(votesFor) })
}

function skipReveal() {
  fireEvent.click(screen.getByRole('button', { name: 'Skip the suspense' }))
}

function justify(name: string) {
  return screen.getByRole('region', { name })
}

function button(name: string) {
  return screen.queryByRole('button', { name })
}

describe('Ceremony', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('reveals players one at a time, then shows the buttons', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    renderCeremony(['p1', 'p2'])
    expect(screen.getByRole('button', { name: /^Ana: accepts the bone/ })).toBeInTheDocument()
    expect(button('End here')).toBeNull()
    act(() => vi.advanceTimersByTime(1200))
    expect(screen.getByRole('button', { name: /^Ben: accepts the bone/ })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByRole('button', { name: /^Cleo: cutoff/ })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByText('2 of 3 accepted the bone.')).toBeInTheDocument()
    expect(screen.getByText('Cleo is out.')).toBeInTheDocument()
    expect(button('End here')).toBeInTheDocument()
  })

  it('keeps the new buttons untappable while they fade into the spot Skip just left', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    renderCeremony(['p1', 'p2'])
    skipReveal()
    const actions = button('End here')!.closest('.ceremony__actions')
    expect(actions).toHaveAttribute('data-locked')
    act(() => vi.advanceTimersByTime(ACTIONS_LOCK_MS))
    expect(actions).not.toHaveAttribute('data-locked')
  })

  it('tapping the card reveals the next player', () => {
    renderCeremony(['p1'])
    fireEvent.click(screen.getByRole('button', { name: /^Ana:/ }))
    expect(screen.getByRole('button', { name: /^Ben: cutoff/ })).toBeInTheDocument()
  })

  it('offers Continue and End here when the game can go on', () => {
    renderCeremony(['p1', 'p2'])
    skipReveal()
    expect(justify('Justify yourselves')).toHaveTextContent('Ana and Ben, tell the room what you saw in them.')
    expect(screen.getByText(`“${stages[0].punchline}”`)).toBeInTheDocument()
    expect(button('See the results')).toBeNull()
    fireEvent.click(button('Continue to stage 2')!)
    expect(loadState()).toMatchObject({ screen: 'intro', stageIndex: 1 })
  })

  it('ends as host-ended from End here', () => {
    renderCeremony(['p1', 'p2'])
    skipReveal()
    fireEvent.click(button('End here')!)
    expect(loadState()).toMatchObject({ screen: 'end', endReason: 'host-ended' })
  })

  it('shows the dust and only See the results when nobody accepted', () => {
    renderCeremony([])
    skipReveal()
    expect(screen.getByText('Nobody accepted the bone.')).toBeInTheDocument()
    expect(justify('Justify yourselves')).toHaveTextContent('Ana, Ben and Cleo, what was the dealbreaker?')
    expect(fireDustBurst).toHaveBeenCalledOnce()
    expect(fireBoneBurst).not.toHaveBeenCalled()
    expect(button('Continue to stage 2')).toBeNull()
    expect(button('End here')).toBeNull()
    fireEvent.click(button('See the results')!)
    expect(loadState()).toMatchObject({ screen: 'end', endReason: 'nobody-accepted' })
  })

  it('shows only See the results on the last stage', () => {
    renderCeremony(['p1', 'p3'], LAST)
    skipReveal()
    expect(button(`Continue to stage ${LAST + 2}`)).toBeNull()
    fireEvent.click(button('See the results')!)
    expect(loadState()).toMatchObject({ screen: 'end', endReason: 'out-of-stages' })
  })

  it('fires the bone burst on a unanimous accept', () => {
    renderCeremony(['p1', 'p2', 'p3'])
    skipReveal()
    expect(screen.getByText('Everyone accepted the bone.')).toBeInTheDocument()
    expect(fireBoneBurst).toHaveBeenCalledOnce()
  })

  it('puts a lone holdout in the spotlight', () => {
    renderCeremony(['p2'])
    skipReveal()
    expect(screen.getByRole('dialog', { name: "Ben, you're the last one holding a bone. Defend yourself." })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hear them out' }))
    expect(justify('Justify yourself')).toHaveTextContent('Ben, tell the room what you saw in them.')
  })

  it('reveals only the players still in and says who just went out', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    renderRounds([['p1', 'p2', 'p3'], ['p1', 'p2'], ['p1']])
    expect(screen.getByRole('button', { name: /^Ana: accepts the bone/ })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1200))
    expect(screen.getByRole('button', { name: /^Ben: cutoff/ })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(screen.queryByRole('button', { name: /^Cleo/ })).toBeNull()
    expect(screen.getByText('Only Ana accepted the bone.')).toBeInTheDocument()
    expect(screen.getByText('Ben is out.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Cutoff' })).toHaveTextContent('Ben')
    expect(screen.getByRole('region', { name: 'Cutoff' })).not.toHaveTextContent('Cleo')
  })

  it('names several players going out at once', () => {
    renderRounds([['p2']])
    skipReveal()
    expect(screen.getByText('Ana and Cleo are out.')).toBeInTheDocument()
  })

  it('calls it unanimous when everyone still in accepts', () => {
    renderRounds([['p1', 'p2'], ['p1', 'p2']])
    skipReveal()
    expect(screen.getByText('Everyone still in accepted the bone.')).toBeInTheDocument()
    expect(screen.queryByText(/is out\.|are out\./)).toBeNull()
    expect(fireBoneBurst).toHaveBeenCalledOnce()
  })

  it('asks only the players who just went out for the dealbreaker', () => {
    renderRounds([['p1', 'p2'], []])
    skipReveal()
    expect(screen.getByText('Nobody accepted the bone.')).toBeInTheDocument()
    expect(justify('Justify yourselves')).toHaveTextContent('Ana and Ben, what was the dealbreaker?')
    expect(screen.queryByText(/are out\./)).toBeNull()
  })

  it('keeps the last player left in the spotlight', () => {
    renderRounds([['p1', 'p2'], ['p1'], ['p1']])
    skipReveal()
    expect(screen.getByText('Only Ana accepted the bone.')).toBeInTheDocument()
    expect(screen.queryByText(/is out\./)).toBeNull()
    expect(screen.getByRole('dialog', { name: "Ana, you're the last one holding a bone. Defend yourself." })).toBeInTheDocument()
  })
})
