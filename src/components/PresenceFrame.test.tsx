import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { PresenceFrame } from './PresenceFrame'
import { INPUT_LOCK_MS, useInputLock } from './useInputLock'

describe('input lock', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('keeps a freshly mounted frame untappable long enough to swallow a double-tap', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { container } = render(<PresenceFrame>content</PresenceFrame>)
    const frame = container.firstElementChild!
    expect(frame).toHaveAttribute('data-locked')
    act(() => vi.advanceTimersByTime(INPUT_LOCK_MS - 1))
    expect(frame).toHaveAttribute('data-locked')
    act(() => vi.advanceTimersByTime(1))
    expect(frame).not.toHaveAttribute('data-locked')
  })

  it('locks again whenever the key changes', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const hook = renderHook(({ key }) => useInputLock(key, 300), { initialProps: { key: false } })
    act(() => vi.advanceTimersByTime(300))
    expect(hook.result.current).toBe(false)
    hook.rerender({ key: true })
    expect(hook.result.current).toBe(true)
    act(() => vi.advanceTimersByTime(300))
    expect(hook.result.current).toBe(false)
  })
})
