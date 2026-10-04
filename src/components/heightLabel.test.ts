import { describe, expect, it } from 'vitest'
import { heightLabel } from './heightLabel'

describe('heightLabel', () => {
  it('rounds to one decimal and keeps the trailing zero', () => {
    expect(heightLabel(1.07)).toBe('About 1.1 m')
    expect(heightLabel(1.72)).toBe('About 1.7 m')
    expect(heightLabel(1)).toBe('About 1.0 m')
  })
})
