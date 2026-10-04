import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { loadState } from '../game/persistence'
import { PLAYERS, renderScreen, votesFor } from './play/renderScreen'
import { Vote } from './Vote'

function tile(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^${name}`) })
}

async function openTally(state = {}) {
  renderScreen(<Vote />, { screen: 'vote', ...state })
  await screen.findByRole('heading', { name: 'Who accepted the bone?' })
}

describe('Vote', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(cleanup)

  it('opens straight on the player tiles', () => {
    renderScreen(<Vote />, { screen: 'vote' })
    expect(screen.getByRole('heading', { name: 'Who accepted the bone?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Blind vote on three' })).toBeInTheDocument()
  })

  it('runs the 3-2-1 countdown for a blind vote and returns to the tiles', async () => {
    renderScreen(<Vote />, { screen: 'vote' })
    fireEvent.click(screen.getByRole('button', { name: 'Blind vote on three' }))
    expect(await screen.findByRole('timer')).toHaveTextContent('3')
    expect(await screen.findByRole('heading', { name: 'Who accepted the bone?' }, { timeout: 6000 })).toBeInTheDocument()
  })

  it('starts everyone on cutoff and toggles accept with a live tally', async () => {
    await openTally()
    for (const p of PLAYERS) expect(tile(p.name)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('0 of 3 accept the bone')
    fireEvent.click(tile('Ana'))
    expect(tile('Ana')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('1 of 3 accept the bone')
    fireEvent.click(tile('Ana'))
    expect(tile('Ana')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('0 of 3 accept the bone')
  })

  it('submits a vote for every player at stage 1', async () => {
    await openTally()
    fireEvent.click(tile('Ben'))
    fireEvent.click(screen.getByRole('button', { name: 'Lock in votes' }))
    const saved = loadState()
    expect(saved?.screen).toBe('ceremony')
    expect(saved?.votes[0]).toEqual({ p1: 'cutoff', p2: 'accept', p3: 'cutoff' })
  })

  it('shows only players still in as tiles and lists the rest as out', async () => {
    await openTally({ stageIndex: 2, votes: [votesFor(['p1', 'p2']), votesFor(['p1'])] })
    expect(tile('Ana')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Ben/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Cleo/ })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('0 of 1 accept the bone')
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
    fireEvent.click(tile('Cleo'))
    fireEvent.click(screen.getByRole('button', { name: 'Lock in votes' }))
    expect(loadState()?.votes[1]).toEqual({ p1: 'cutoff', p3: 'accept' })
  })
})
