import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { stages } from '../content/loader'
import { loadState } from '../game/persistence'
import { renderScreen } from './play/renderScreen'
import { StageIntro } from './StageIntro'

describe('StageIntro', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(cleanup)

  it('shows the stage write-up for the host to read', () => {
    const stage = stages[2]
    renderScreen(<StageIntro />, { screen: 'intro', stageIndex: 2 })
    expect(screen.getByText(`Stage 3 of ${stages.length}`)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: stage.species })).toBeInTheDocument()
    expect(screen.getByText(`“${stage.nickname}”`)).toBeInTheDocument()
    expect(screen.getByText(stage.lived.display)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(stage.facts.length)
  })

  it('opens the fullscreen portrait viewer', () => {
    renderScreen(<StageIntro />, { screen: 'intro' })
    fireEvent.click(screen.getByRole('button', { name: 'Show the male portrait fullscreen' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Male' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('moves on to the vote', () => {
    renderScreen(<StageIntro />, { screen: 'intro' })
    fireEvent.click(screen.getByRole('button', { name: 'Collect the votes' }))
    expect(loadState()?.screen).toBe('vote')
  })
})
