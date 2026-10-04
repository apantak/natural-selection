import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { GameProvider } from '../app/GameProvider'
import { initialState } from '../game/engine'
import { saveState } from '../game/persistence'
import { Setup } from './Setup'

function renderSetup() {
  saveState({ ...initialState(), screen: 'setup', adultConfirmed: true })
  return render(
    <GameProvider>
      <Setup />
    </GameProvider>,
  )
}

function addPlayer(name: string) {
  fireEvent.change(screen.getByLabelText('Player name'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
}

function playerNames() {
  return within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('.setup__name')?.textContent)
}

describe('Setup', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(cleanup)

  it('shows an inline error for an empty name', () => {
    renderSetup()
    addPlayer('   ')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name.')
  })

  it('rejects duplicate names case-insensitively and clears the error on typing', () => {
    renderSetup()
    addPlayer('Dave')
    addPlayer('dave ')
    expect(screen.getByRole('alert')).toHaveTextContent('That name is taken.')
    expect(playerNames()).toEqual(['Dave'])
    fireEvent.change(screen.getByLabelText('Player name'), { target: { value: 'Dav' } })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('adds with the Enter key and clears the input', () => {
    renderSetup()
    const input = screen.getByLabelText('Player name')
    fireEvent.change(input, { target: { value: 'Ana' } })
    fireEvent.submit(input.closest('form')!)
    expect(playerNames()).toEqual(['Ana'])
    expect(input).toHaveValue('')
  })

  it('enables Start only once three valid players exist', () => {
    renderSetup()
    const start = () => screen.getByRole('button', { name: 'Start the show' })
    addPlayer('Ana')
    addPlayer('Ben')
    expect(start()).toBeDisabled()
    expect(screen.getByText('Add 1 more player to start.')).toBeInTheDocument()
    addPlayer('Cleo')
    expect(start()).toBeEnabled()
  })

  it('reorders with the move buttons and removes players', () => {
    renderSetup()
    addPlayer('Ana')
    addPlayer('Ben')
    addPlayer('Cleo')
    fireEvent.click(screen.getByRole('button', { name: 'Move Ana down' }))
    expect(playerNames()).toEqual(['Ben', 'Ana', 'Cleo'])
    expect(screen.getByRole('button', { name: 'Move Ben up' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Ana' }))
    expect(screen.getByRole('button', { name: 'Start the show' })).toBeDisabled()
  })

  it('disables the input at eight players', () => {
    renderSetup()
    for (const name of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) addPlayer(name)
    expect(screen.getByLabelText('Player name')).toBeDisabled()
    expect(screen.getByLabelText('8 of 8 players')).toBeInTheDocument()
  })
})
