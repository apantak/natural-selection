import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

const props = () => ({
  title: 'Quit game?',
  confirmLabel: 'Quit',
  cancelLabel: 'Stay',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
})

describe('ConfirmDialog', () => {
  afterEach(cleanup)

  it('renders nothing when closed', () => {
    render(<ConfirmDialog open={false} {...props()} />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('focuses the safe choice and wires both buttons', () => {
    const p = props()
    render(<ConfirmDialog open {...p} />)
    expect(screen.getByRole('alertdialog', { name: 'Quit game?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Quit' }))
    expect(p.onConfirm).toHaveBeenCalledOnce()
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
    expect(p.onCancel).toHaveBeenCalledOnce()
  })
})
