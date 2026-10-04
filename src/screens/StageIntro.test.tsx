import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { heightLabel } from '../components'
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

  it('shows each reconstruction height under its portrait', () => {
    const stage = stages[3]
    renderScreen(<StageIntro />, { screen: 'intro', stageIndex: 3 })
    const female = screen.getByRole('button', { name: `Enlarge female ${stage.species}` })
    const male = screen.getByRole('button', { name: `Enlarge male ${stage.species}` })
    expect(female).toHaveAccessibleDescription(heightLabel(stage.heightMeters.female))
    expect(male).toHaveAccessibleDescription(heightLabel(stage.heightMeters.male))
    expect(screen.getByText(heightLabel(stage.heightMeters.female))).toBeInTheDocument()
    expect(screen.getByText(heightLabel(stage.heightMeters.male))).toBeInTheDocument()
  })

  it('opens the fullscreen portrait viewer', () => {
    renderScreen(<StageIntro />, { screen: 'intro' })
    fireEvent.click(screen.getByRole('button', { name: `Enlarge male ${stages[0].species}` }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Male' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('moves on to the vote', () => {
    renderScreen(<StageIntro />, { screen: 'intro' })
    fireEvent.click(screen.getByRole('button', { name: 'Collect the votes' }))
    expect(loadState()?.screen).toBe('vote')
  })
})
