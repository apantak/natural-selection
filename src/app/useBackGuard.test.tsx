import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { Screen } from '../game/types'
import { useBackGuard } from './useBackGuard'

function setup(screen: Screen) {
  const dispatch = vi.fn()
  const hook = renderHook(({ s }) => useBackGuard(s, dispatch), { initialProps: { s: screen } })
  return { dispatch, hook }
}

function pressBack() {
  act(() => {
    history.replaceState(null, '')
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
  })
}

describe('useBackGuard', () => {
  beforeEach(() => history.replaceState(null, ''))
  afterEach(cleanup)

  it('pushes a guard entry when leaving home', () => {
    const before = history.length
    setup('setup')
    expect(history.length).toBe(before + 1)
    expect(history.state).toEqual({ wyatbGuard: true })
  })

  it('goes home when back is pressed on setup', () => {
    const { dispatch } = setup('setup')
    pressBack()
    expect(dispatch).toHaveBeenCalledWith({ type: 'goHome' })
  })

  it('asks before quitting during play and re-arms the guard', () => {
    const { dispatch, hook } = setup('vote')
    pressBack()
    expect(hook.result.current.quitOpen).toBe(true)
    expect(history.state).toEqual({ wyatbGuard: true })
    expect(dispatch).not.toHaveBeenCalled()
    act(() => hook.result.current.confirmQuit())
    expect(dispatch).toHaveBeenCalledWith({ type: 'newGame' })
    expect(hook.result.current.quitOpen).toBe(false)
  })

  it('keeps playing when the quit prompt is cancelled', () => {
    const { dispatch, hook } = setup('ceremony')
    pressBack()
    act(() => hook.result.current.cancelQuit())
    expect(hook.result.current.quitOpen).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
  })
})
