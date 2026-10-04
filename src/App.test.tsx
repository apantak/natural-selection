import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { fireDustBurst } from './components/bursts'
import { initialState } from './game/engine'
import { saveState } from './game/persistence'
import { PLAYERS, votesFor } from './screens/play/renderScreen'

vi.mock('./components/bursts', () => ({ fireBoneBurst: vi.fn(), fireDustBurst: vi.fn() }))

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear()
    history.replaceState(null, '')
    vi.clearAllMocks()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('freezes the leaving ceremony so it cannot replay itself as a dud', async () => {
    saveState({
      ...initialState(),
      adultConfirmed: true,
      players: PLAYERS,
      screen: 'ceremony',
      votes: [votesFor(['p1', 'p2', 'p3'])],
    })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Skip the suspense' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue to stage 2' }))

    expect(screen.getByText('Everyone accepted the bone.')).toBeInTheDocument()
    expect(screen.queryByText('Nobody accepted the bone.')).toBeNull()
    await screen.findByRole('button', { name: 'Collect the votes' })
    expect(fireDustBurst).not.toHaveBeenCalled()
  })

  it('locks the next screen while it arrives so a double-tap cannot fall through', async () => {
    saveState({ ...initialState(), adultConfirmed: true, players: PLAYERS, screen: 'intro' })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Collect the votes' }))
    const skip = await screen.findByRole('button', { name: 'Skip countdown' })
    expect(skip.closest('[data-locked]')).not.toBeNull()
    await waitFor(() => expect(skip.closest('[data-locked]')).toBeNull())
  })
})
