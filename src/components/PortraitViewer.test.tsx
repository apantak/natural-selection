import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { stages } from '../content/loader'
import { heightLabel } from './heightLabel'
import { PortraitViewer } from './PortraitViewer'

function Harness({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <button type="button">Open portraits</button>
      <button type="button">Collect the votes</button>
      <PortraitViewer open={open} stage={stages[0]} onClose={onClose} />
    </>
  )
}

function pressBack() {
  act(() => {
    history.replaceState({ wyatbGuard: true }, '')
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }))
  })
}

describe('PortraitViewer', () => {
  let back: MockInstance<History['back']>

  beforeEach(() => {
    history.replaceState({ wyatbGuard: true }, '')
    back = vi.spyOn(history, 'back').mockImplementation(() => {})
  })
  afterEach(async () => {
    cleanup()
    await new Promise((resolve) => setTimeout(resolve))
    vi.restoreAllMocks()
  })

  it('shows the height of the portrait on screen and updates it on switch', () => {
    const { female, male } = stages[0].heightMeters
    render(<Harness open onClose={vi.fn()} />)
    expect(screen.getByText(`Female · ${heightLabel(female)}`)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Male' }))
    expect(screen.getByText(`Male · ${heightLabel(male)}`)).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText(`Female · ${heightLabel(female)}`)).toBeInTheDocument()
  })

  it('closes on the system back button instead of leaving the page', () => {
    const onClose = vi.fn()
    render(<Harness open onClose={onClose} />)
    expect(history.state).toEqual({ wyatbOverlay: true })
    pressBack()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape and drops its history entry', async () => {
    const onClose = vi.fn()
    const view = render(<Harness open onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    view.rerender(<Harness open={false} onClose={onClose} />)
    await waitFor(() => expect(back).toHaveBeenCalledOnce())
  })

  it('moves focus in, keeps Tab inside, and gives focus back on close', async () => {
    const onClose = vi.fn()
    const view = render(<Harness open={false} onClose={onClose} />)
    const trigger = screen.getByRole('button', { name: 'Open portraits' })
    trigger.focus()
    view.rerender(<Harness open onClose={onClose} />)

    const dialog = screen.getByRole('dialog')
    expect(screen.getByRole('button', { name: 'Close portraits' })).toHaveFocus()
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    screen.getByRole('button', { name: 'Collect the votes' }).focus()
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    view.rerender(<Harness open={false} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(trigger).toHaveFocus()
    })
  })
})
