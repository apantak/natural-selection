import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { Countdown } from './Countdown'

describe('Countdown', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('counts 3-2-1 then calls onDone once', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<Countdown onDone={onDone} stepMs={100} />)
    expect(screen.getByRole('timer')).toHaveTextContent('3')
    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole('timer')).toHaveTextContent('2')
    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole('timer')).toHaveTextContent('1')
    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole('timer')).toHaveTextContent('Vote!')
    expect(onDone).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(70))
    expect(onDone).toHaveBeenCalledOnce()
  })
})
