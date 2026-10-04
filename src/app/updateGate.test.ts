import { describe, expect, it, vi } from 'vitest'
import { createUpdateGate } from './updateGate'

function setup() {
  const update = vi.fn().mockResolvedValue(undefined)
  let needRefresh = () => {}
  const setSafe = createUpdateGate(({ onNeedRefresh }) => {
    needRefresh = onNeedRefresh
    return update
  })
  return { update, setSafe, needRefresh: () => needRefresh() }
}

describe('createUpdateGate', () => {
  it('holds a waiting update until the app is somewhere safe', () => {
    const { update, setSafe, needRefresh } = setup()
    setSafe(false)
    needRefresh()
    expect(update).not.toHaveBeenCalled()
    setSafe(true)
    expect(update).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('applies an update at once when it arrives on a safe screen', () => {
    const { update, setSafe, needRefresh } = setup()
    setSafe(true)
    needRefresh()
    expect(update).toHaveBeenCalledExactlyOnceWith(true)
    setSafe(false)
    setSafe(true)
    expect(update).toHaveBeenCalledOnce()
  })

  it('does nothing when no update is waiting', () => {
    const { update, setSafe } = setup()
    setSafe(true)
    expect(update).not.toHaveBeenCalled()
  })
})
