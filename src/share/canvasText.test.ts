import { describe, expect, it } from 'vitest'
import { ellipsize, fitFont, wrapLines } from './canvasText'

function fakeCtx() {
  const ctx = {
    font: '10px x',
    measureText(text: string) {
      const size = Number.parseInt(ctx.font, 10)
      return { width: [...text].length * size } as TextMetrics
    },
  }
  return ctx
}

describe('fitFont', () => {
  it('keeps the start size when the text fits', () => {
    const ctx = fakeCtx()
    expect(fitFont(ctx, 'abc', 100, 20, 10, (s) => `${s}px x`)).toBe(20)
    expect(ctx.font).toBe('20px x')
  })

  it('shrinks until the text fits', () => {
    const ctx = fakeCtx()
    expect(fitFont(ctx, 'abcde', 60, 20, 8, (s) => `${s}px x`)).toBe(12)
    expect(ctx.font).toBe('12px x')
  })

  it('stops at the minimum size', () => {
    const ctx = fakeCtx()
    expect(fitFont(ctx, 'abcdefghij', 10, 20, 9, (s) => `${s}px x`)).toBe(9)
  })
})

describe('ellipsize', () => {
  it('leaves fitting text alone', () => {
    expect(ellipsize(fakeCtx(), 'abc', 30)).toBe('abc')
  })

  it('cuts long text and adds an ellipsis', () => {
    expect(ellipsize(fakeCtx(), 'abcdefgh', 50)).toBe('abcd…')
  })
})

describe('wrapLines', () => {
  it('wraps words greedily', () => {
    expect(wrapLines(fakeCtx(), "You didn't even make it", 100)).toEqual(["You didn't", 'even make', 'it'])
  })

  it('returns no lines for blank text', () => {
    expect(wrapLines(fakeCtx(), '   ', 100)).toEqual([])
  })
})
