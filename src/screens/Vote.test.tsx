import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { loadState } from '../game/persistence'
import { PLAYERS, renderScreen, votesFor } from './play/renderScreen'
import { Vote } from './Vote'

function row(name: string) {
  return screen.getByRole('radiogroup', { name })
}

function pick(name: string, option: 'Accept' | 'Cut off') {
  fireEvent.click(within(row(name)).getByRole('radio', { name: option }))
}

function lockIn() {
  return screen.getByRole('button', { name: 'Lock in votes' })
}

async function openTally(state = {}) {
  renderScreen(<Vote />, { screen: 'vote', ...state })
  await screen.findByRole('heading', { name: 'Who accepted the bone?' })
}

describe('Vote', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(cleanup)

  it('opens straight on the player rows', () => {
    renderScreen(<Vote />, { screen: 'vote' })
    expect(screen.getByRole('heading', { name: 'Who accepted the bone?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Blind vote on three' })).toBeInTheDocument()
  })

  it('runs the 3-2-1 countdown for a blind vote and returns to the rows', async () => {
    renderScreen(<Vote />, { screen: 'vote' })
    fireEvent.click(screen.getByRole('button', { name: 'Blind vote on three' }))
    expect(await screen.findByRole('timer')).toHaveTextContent('3')
    expect(await screen.findByRole('heading', { name: 'Who accepted the bone?' }, { timeout: 6000 })).toBeInTheDocument()
  })

  it('starts everyone undecided with Lock in disabled', async () => {
    await openTally()
    for (const p of PLAYERS) {
      for (const option of within(row(p.name)).getAllByRole('radio')) expect(option).not.toBeChecked()
    }
    expect(screen.getByRole('status')).toHaveTextContent('3 still to decide')
    expect(lockIn()).toBeDisabled()
    expect(screen.getByText(/Cut off is final/)).toBeInTheDocument()
  })

  it('labels each choice and keeps exactly one picked per player', async () => {
    await openTally()
    pick('Ana', 'Accept')
    expect(within(row('Ana')).getByRole('radio', { name: 'Accept' })).toBeChecked()
    expect(within(row('Ana')).getByRole('radio', { name: 'Cut off' })).not.toBeChecked()
    expect(row('Ana')).toHaveAttribute('data-vote', 'accept')
    expect(screen.getByRole('status')).toHaveTextContent('2 still to decide')
    pick('Ana', 'Cut off')
    expect(within(row('Ana')).getByRole('radio', { name: 'Accept' })).not.toBeChecked()
    expect(within(row('Ana')).getByRole('radio', { name: 'Cut off' })).toBeChecked()
    expect(row('Ana')).toHaveAttribute('data-vote', 'cutoff')
    expect(screen.getByRole('status')).toHaveTextContent('2 still to decide')
  })

  it('enables Lock in only once every player is decided', async () => {
    await openTally()
    pick('Ana', 'Cut off')
    pick('Ben', 'Accept')
    expect(lockIn()).toBeDisabled()
    fireEvent.click(lockIn())
    expect(loadState()?.screen).toBe('vote')
    pick('Cleo', 'Cut off')
    expect(screen.getByRole('status')).toHaveTextContent('Ana and Cleo go out')
    expect(lockIn()).toBeEnabled()
  })

  it('names who goes out before the votes are locked in', async () => {
    await openTally()
    pick('Ana', 'Accept')
    pick('Ben', 'Accept')
    pick('Cleo', 'Accept')
    expect(screen.getByRole('status')).toHaveTextContent('Everyone stays in')
    pick('Ben', 'Cut off')
    expect(screen.getByRole('status')).toHaveTextContent('Ben goes out')
    pick('Ana', 'Cut off')
    pick('Cleo', 'Cut off')
    expect(screen.getByRole('status')).toHaveTextContent('Everyone goes out')
  })

  it('says the last player left goes out when they cut off', async () => {
    await openTally({ stageIndex: 2, votes: [votesFor(['p1', 'p2']), votesFor(['p1'])] })
    pick('Ana', 'Cut off')
    expect(screen.getByRole('status')).toHaveTextContent('Ana goes out')
  })

  it('submits a vote for every player at stage 1', async () => {
    await openTally()
    pick('Ana', 'Cut off')
    pick('Ben', 'Accept')
    pick('Cleo', 'Cut off')
    fireEvent.click(lockIn())
    const saved = loadState()
    expect(saved?.screen).toBe('ceremony')
    expect(saved?.votes[0]).toEqual({ p1: 'cutoff', p2: 'accept', p3: 'cutoff' })
  })

  it('keeps choices through a blind vote countdown', async () => {
    await openTally()
    pick('Ben', 'Accept')
    fireEvent.click(screen.getByRole('button', { name: 'Blind vote on three' }))
    await screen.findByRole('heading', { name: 'Who accepted the bone?' }, { timeout: 6000 })
    expect(within(row('Ben')).getByRole('radio', { name: 'Accept' })).toBeChecked()
  })

  it('shows only players still in as rows and lists the rest as out', async () => {
    await openTally({ stageIndex: 2, votes: [votesFor(['p1', 'p2']), votesFor(['p1'])] })
    expect(screen.getAllByRole('radiogroup').map((g) => g.textContent)).toEqual([expect.stringMatching(/^Ana/)])
    expect(screen.getByRole('status')).toHaveTextContent('1 still to decide')
    const out = screen.getByRole('region', { name: 'Out' })
    const rows = Array.from(out.querySelectorAll('li'), (li) => li.textContent)
    expect(rows).toEqual(['BenOut since stage 2', 'CleoOut since stage 1'])
  })

  it('hides the out list while everyone is still in', async () => {
    await openTally()
    expect(screen.queryByRole('region', { name: 'Out' })).toBeNull()
  })

  it('submits votes only for players still in', async () => {
    await openTally({ stageIndex: 1, votes: [votesFor(['p1', 'p3'])] })
    pick('Ana', 'Cut off')
    pick('Cleo', 'Accept')
    fireEvent.click(lockIn())
    expect(loadState()?.votes[1]).toEqual({ p1: 'cutoff', p3: 'accept' })
  })
})
