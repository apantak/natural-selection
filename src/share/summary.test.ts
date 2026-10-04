import { describe, expect, it } from 'vitest'
import { stages } from '../content/loader'
import type { GameResults, Player } from '../game/types'
import { displayNames, endReasonLine, joinNames, NEVER_ACCEPTED, summarize } from './summary'

const players: Player[] = [
  { id: 'p1', name: 'Dave' },
  { id: 'p2', name: 'Sue' },
  { id: 'p3', name: 'Mo' },
  { id: 'p4', name: 'Ana' },
]

const results: GameResults = {
  personalCutoff: { p1: 1, p2: 4, p3: null, p4: 4 },
  groupCutoff: 1,
  lastStanding: ['p2', 'p4'],
  stagesPlayed: 5,
}

describe('summarize', () => {
  it('ranks players by how far back they went, sharing ranks on ties', () => {
    const { ranking } = summarize({ results, players, stages, hideNames: false })
    expect(ranking.map((r) => [r.name, r.rank, r.cutoff])).toEqual([
      ['Sue', 1, 4],
      ['Ana', 1, 4],
      ['Dave', 3, 1],
      ['Mo', 4, null],
    ])
    expect(ranking[0].label).toBe(stages[4].species)
    expect(ranking[3].label).toBe(NEVER_ACCEPTED)
  })

  it('marks every tied last one standing', () => {
    const summary = summarize({ results, players, stages, hideNames: false })
    expect(summary.crowned).toEqual(['Sue', 'Ana'])
    expect(summary.ranking.filter((r) => r.crowned).map((r) => r.id)).toEqual(['p2', 'p4'])
  })

  it('exposes the group cutoff stage', () => {
    const summary = summarize({ results, players, stages, hideNames: false })
    expect(summary.group).toBe(stages[1])
    expect(summary.groupIndex).toBe(1)
  })

  it('has no group stage when no majority ever accepted', () => {
    const summary = summarize({ results: { ...results, groupCutoff: null }, players, stages, hideNames: false })
    expect(summary.group).toBeNull()
  })

  it('replaces names with Player 1..n in setup order when hidden', () => {
    const summary = summarize({ results, players, stages, hideNames: true })
    expect(summary.ranking.map((r) => r.name)).toEqual(['Player 2', 'Player 4', 'Player 1', 'Player 3'])
    expect(summary.crowned).toEqual(['Player 2', 'Player 4'])
    expect(JSON.stringify(summary.ranking)).not.toMatch(/Dave|Sue|Mo|Ana/)
  })

  it('crowns nobody when nobody ever accepted', () => {
    const none: GameResults = { personalCutoff: { p1: null, p2: null, p3: null, p4: null }, groupCutoff: null, lastStanding: [], stagesPlayed: 1 }
    const summary = summarize({ results: none, players, stages, hideNames: false })
    expect(summary.crowned).toEqual([])
    expect(summary.ranking.every((r) => r.rank === 1 && r.label === NEVER_ACCEPTED)).toBe(true)
  })
})

describe('displayNames', () => {
  it('keeps real names unless hidden', () => {
    expect(displayNames(players, false).p3).toBe('Mo')
    expect(displayNames(players, true).p3).toBe('Player 3')
  })
})

describe('endReasonLine', () => {
  it('describes each ending', () => {
    expect(endReasonLine('out-of-stages', 10, stages)).toBe('You went all the way back 7 million years.')
    expect(endReasonLine('nobody-accepted', 2, stages)).toContain(stages[1].species)
    expect(endReasonLine('host-ended', 1, stages)).toBe('The host called it after 1 stage.')
    expect(endReasonLine('host-ended', 4, stages)).toBe('The host called it after 4 stages.')
    expect(endReasonLine(null, 0, stages)).toBeNull()
  })
})

describe('joinNames', () => {
  it('joins names naturally', () => {
    expect(joinNames([])).toBe('')
    expect(joinNames(['Sue'])).toBe('Sue')
    expect(joinNames(['Sue', 'Ana'])).toBe('Sue & Ana')
    expect(joinNames(['Sue', 'Ana', 'Mo'])).toBe('Sue, Ana & Mo')
  })
})
