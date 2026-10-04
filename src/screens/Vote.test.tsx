import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { loadState } from '../game/persistence'
import { PLAYERS, renderScreen } from './play/renderScreen'
import { Vote } from './Vote'

function tile(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^${name}`) })
}

async function openTally() {
  renderScreen(<Vote />, { screen: 'vote' })
  fireEvent.click(screen.getByRole('button', { name: 'Skip countdown' }))
  await screen.findByRole('heading', { name: 'Who accepted the bone?' })
}

describe('Vote', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(cleanup)

  it('opens with the on-three prompt', () => {
    renderScreen(<Vote />, { screen: 'vote' })
    expect(screen.getByRole('heading', { name: 'On three' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Count us in' })).toBeInTheDocument()
  })

  it('runs the 3-2-1 countdown when counted in', async () => {
    renderScreen(<Vote />, { screen: 'vote' })
    fireEvent.click(screen.getByRole('button', { name: 'Count us in' }))
    expect(await screen.findByRole('timer')).toHaveTextContent('3')
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

  it('submits a vote for every player', async () => {
    await openTally()
    fireEvent.click(tile('Ben'))
    fireEvent.click(screen.getByRole('button', { name: 'Lock in votes' }))
    const saved = loadState()
    expect(saved?.screen).toBe('ceremony')
    expect(saved?.votes[0]).toEqual({ p1: 'cutoff', p2: 'accept', p3: 'cutoff' })
  })
})
