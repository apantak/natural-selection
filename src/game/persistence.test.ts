import { describe, expect, it } from 'vitest'
import { activePlayers, computeResults, stageOutcome } from './engine'
import { clearState, loadState, saveState } from './persistence'
import type { GameState } from './types'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

class BrokenStorage extends MemoryStorage {
  getItem(): string | null {
    throw new Error('denied')
  }
  setItem() {
    throw new Error('quota')
  }
  removeItem() {
    throw new Error('denied')
  }
}

const sample: GameState = {
  screen: 'ceremony',
  adultConfirmed: true,
  players: [
    { id: 'p1', name: 'Ann' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Cat' },
  ],
  stageIndex: 1,
  votes: [
    { p1: 'accept', p2: 'accept', p3: 'cutoff' },
    { p1: 'accept', p2: 'cutoff', p3: 'cutoff' },
  ],
  endReason: null,
}

function storedKey(storage: Storage): string {
  saveState(sample, storage)
  return storage.key(0)!
}

function withRaw(raw: string): Storage {
  const storage = new MemoryStorage()
  storage.setItem(storedKey(new MemoryStorage()), raw)
  return storage
}

function withPayload(state: unknown, version: unknown = 1): Storage {
  return withRaw(JSON.stringify({ version, state }))
}

describe('persistence', () => {
  it('round-trips a state', () => {
    const storage = new MemoryStorage()
    saveState(sample, storage)
    expect(loadState(storage)).toEqual(sample)
  })

  it('round-trips an ended game', () => {
    const storage = new MemoryStorage()
    const ended: GameState = { ...sample, screen: 'end', endReason: 'host-ended' }
    saveState(ended, storage)
    expect(loadState(storage)).toEqual(ended)
  })

  it('loads an older save that recorded votes for eliminated players', () => {
    const old: GameState = {
      ...sample,
      screen: 'end',
      stageIndex: 2,
      votes: [
        { p1: 'accept', p2: 'accept', p3: 'cutoff' },
        { p1: 'accept', p2: 'cutoff', p3: 'accept' },
        { p1: 'cutoff', p2: 'accept', p3: 'accept' },
      ],
      endReason: 'nobody-accepted',
    }
    const loaded = loadState(withPayload(old))!
    expect(loaded).toEqual(old)
    expect(activePlayers(loaded).map((p) => p.id)).toEqual(['p1'])
    expect(stageOutcome(loaded, 3)).toMatchObject({ accepters: [], nobody: true })
    expect(computeResults(loaded)).toMatchObject({
      personalCutoff: { p1: 1, p2: 0, p3: null },
      groupCutoff: 0,
      lastStanding: ['p1'],
    })
  })

  it('stores a versioned payload', () => {
    const storage = new MemoryStorage()
    saveState(sample, storage)
    const parsed = JSON.parse(storage.getItem(storage.key(0)!)!)
    expect(parsed).toEqual({ version: 1, state: sample })
  })

  it('returns null when nothing is saved', () => {
    expect(loadState(new MemoryStorage())).toBeNull()
  })

  it('clears the saved state', () => {
    const storage = new MemoryStorage()
    saveState(sample, storage)
    clearState(storage)
    expect(loadState(storage)).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(loadState(withRaw('{not json'))).toBeNull()
    expect(loadState(withRaw('null'))).toBeNull()
    expect(loadState(withRaw('42'))).toBeNull()
  })

  it('returns null for a different version', () => {
    expect(loadState(withPayload(sample, 2))).toBeNull()
    expect(loadState(withPayload(sample, '1'))).toBeNull()
  })

  it.each<[string, unknown]>([
    ['missing state', undefined],
    ['array state', []],
    ['bad screen', { ...sample, screen: 'lobby' }],
    ['bad adultConfirmed', { ...sample, adultConfirmed: 'yes' }],
    ['players not array', { ...sample, players: {} }],
    ['player missing name', { ...sample, players: [{ id: 'p1' }] }],
    ['player bad id', { ...sample, players: [{ id: 1, name: 'Ann' }] }],
    ['duplicate player ids', { ...sample, players: [{ id: 'p1', name: 'A' }, { id: 'p1', name: 'B' }] }],
    ['negative stageIndex', { ...sample, stageIndex: -1 }],
    ['fractional stageIndex', { ...sample, stageIndex: 0.5 }],
    ['string stageIndex', { ...sample, stageIndex: '1' }],
    ['votes not array', { ...sample, votes: {} }],
    ['vote record not object', { ...sample, votes: ['accept'] }],
    ['null vote record', { ...sample, votes: [null] }],
    ['bad vote value', { ...sample, votes: [{ p1: 'maybe' }] }],
    ['bad endReason', { ...sample, endReason: 'bored' }],
    ['missing endReason', { ...sample, endReason: undefined }],
  ])('returns null for %s', (_label, state) => {
    expect(loadState(withPayload(state))).toBeNull()
  })

  it('swallows storage errors', () => {
    const storage = new BrokenStorage()
    expect(() => saveState(sample, storage)).not.toThrow()
    expect(loadState(storage)).toBeNull()
    expect(() => clearState(storage)).not.toThrow()
  })

  it('works without a default storage available', () => {
    expect(() => saveState(sample)).not.toThrow()
    expect(() => loadState()).not.toThrow()
    expect(() => clearState()).not.toThrow()
  })
})
