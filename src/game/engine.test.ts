import { describe, expect, it } from 'vitest'
import {
  activePlayers,
  canStart,
  computeResults,
  createReducer,
  eliminatedAt,
  initialState,
  stageOutcome,
  validatePlayerName,
} from './engine'
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS } from './types'
import type { GameAction, GameState, Player, StageVotes } from './types'

const STAGES = 3
const reduce = createReducer(STAGES)

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(reduce, state)
}

function players(...names: string[]): Player[] {
  return names.map((name, i) => ({ id: `p${i + 1}`, name }))
}

function inSetup(...names: string[]): GameState {
  return { ...initialState(), adultConfirmed: true, screen: 'setup', players: players(...names) }
}

function at(screen: GameState['screen'], overrides: Partial<GameState> = {}): GameState {
  return {
    ...initialState(),
    adultConfirmed: true,
    players: players('Ann', 'Bob', 'Cat'),
    screen,
    ...overrides,
  }
}

function votes(accepters: string[], all = ['p1', 'p2', 'p3']): StageVotes {
  return Object.fromEntries(all.map((id) => [id, accepters.includes(id) ? 'accept' : 'cutoff']))
}

describe('initialState', () => {
  it('starts on home with nothing set', () => {
    expect(initialState()).toEqual({
      screen: 'home',
      adultConfirmed: false,
      players: [],
      stageIndex: 0,
      votes: [],
      endReason: null,
    })
  })

  it('returns a fresh object each call', () => {
    expect(initialState()).not.toBe(initialState())
  })
})

describe('validatePlayerName', () => {
  const list = players('Ann', 'Bob')

  it('accepts a fresh name', () => {
    expect(validatePlayerName(list, 'Cat')).toBeNull()
  })

  it('rejects empty and whitespace-only names', () => {
    expect(validatePlayerName(list, '')).toEqual(expect.any(String))
    expect(validatePlayerName(list, '   ')).toEqual(expect.any(String))
  })

  it('enforces the max length after trimming', () => {
    expect(validatePlayerName(list, 'x'.repeat(MAX_NAME_LENGTH))).toBeNull()
    expect(validatePlayerName(list, `  ${'x'.repeat(MAX_NAME_LENGTH)}  `)).toBeNull()
    expect(validatePlayerName(list, 'x'.repeat(MAX_NAME_LENGTH + 1))).toEqual(expect.any(String))
  })

  it('rejects duplicates case-insensitively and after trimming', () => {
    expect(validatePlayerName(list, 'ann')).toEqual(expect.any(String))
    expect(validatePlayerName(list, '  BOB ')).toEqual(expect.any(String))
  })

  it('ignores the player being renamed', () => {
    expect(validatePlayerName(list, 'ANN', 'p1')).toBeNull()
    expect(validatePlayerName(list, 'Bob', 'p1')).toEqual(expect.any(String))
  })

  it('returns distinct short messages per problem', () => {
    const messages = new Set([
      validatePlayerName(list, ''),
      validatePlayerName(list, 'x'.repeat(MAX_NAME_LENGTH + 1)),
      validatePlayerName(list, 'ann'),
    ])
    expect(messages.size).toBe(3)
    for (const m of messages) expect(m!.length).toBeLessThanOrEqual(40)
  })
})

describe('canStart', () => {
  it('needs between MIN and MAX players', () => {
    expect(canStart(players('A', 'B'))).toBe(false)
    expect(canStart(players('A', 'B', 'C'))).toBe(true)
    expect(canStart(players('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'))).toBe(true)
    expect(canStart(players('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'))).toBe(false)
    expect(MIN_PLAYERS).toBe(3)
    expect(MAX_PLAYERS).toBe(8)
  })

  it('rejects invalid or duplicate names', () => {
    expect(canStart(players('A', 'a', 'B'))).toBe(false)
    expect(canStart(players('A', ' ', 'B'))).toBe(false)
  })
})

describe('navigation actions', () => {
  it('confirmAdult sets adultConfirmed', () => {
    const next = reduce(initialState(), { type: 'confirmAdult' })
    expect(next.adultConfirmed).toBe(true)
    expect(next.screen).toBe('home')
  })

  it('confirmAdult when already confirmed is a no-op', () => {
    const s = at('home')
    expect(reduce(s, { type: 'confirmAdult' })).toBe(s)
  })

  it('openSetup requires adult confirmation', () => {
    const s = initialState()
    expect(reduce(s, { type: 'openSetup' })).toBe(s)
    expect(run(s, { type: 'confirmAdult' }, { type: 'openSetup' }).screen).toBe('setup')
  })

  it('openSetup only from home', () => {
    const s = at('credits')
    expect(reduce(s, { type: 'openSetup' })).toBe(s)
  })

  it('openCredits only from home', () => {
    expect(reduce(initialState(), { type: 'openCredits' }).screen).toBe('credits')
    const s = at('setup')
    expect(reduce(s, { type: 'openCredits' })).toBe(s)
  })

  it('goHome from setup and credits only', () => {
    expect(reduce(at('setup'), { type: 'goHome' }).screen).toBe('home')
    expect(reduce(at('credits'), { type: 'goHome' }).screen).toBe('home')
    for (const screen of ['home', 'intro', 'vote', 'ceremony', 'end'] as const) {
      const s = at(screen)
      expect(reduce(s, { type: 'goHome' })).toBe(s)
    }
  })

  it('goHome from setup keeps players', () => {
    expect(reduce(at('setup'), { type: 'goHome' }).players).toHaveLength(3)
  })
})

describe('player setup actions', () => {
  it('addPlayer trims and appends with a unique id', () => {
    const s = run(inSetup(), { type: 'addPlayer', name: '  Ann ' }, { type: 'addPlayer', name: 'Bob' })
    expect(s.players.map((p) => p.name)).toEqual(['Ann', 'Bob'])
    expect(new Set(s.players.map((p) => p.id)).size).toBe(2)
  })

  it('addPlayer never reuses an existing id', () => {
    const s = run(
      inSetup(),
      { type: 'addPlayer', name: 'A' },
      { type: 'addPlayer', name: 'B' },
      { type: 'addPlayer', name: 'C' },
    )
    const removed = reduce(s, { type: 'removePlayer', id: s.players[0].id })
    const added = reduce(removed, { type: 'addPlayer', name: 'D' })
    expect(new Set(added.players.map((p) => p.id)).size).toBe(3)
  })

  it('addPlayer keeps ids stable for existing players', () => {
    const s = inSetup('Ann', 'Bob')
    const next = reduce(s, { type: 'addPlayer', name: 'Cat' })
    expect(next.players.slice(0, 2)).toEqual(s.players)
  })

  it('addPlayer rejects invalid names', () => {
    const s = inSetup('Ann')
    expect(reduce(s, { type: 'addPlayer', name: 'ann' })).toBe(s)
    expect(reduce(s, { type: 'addPlayer', name: '  ' })).toBe(s)
    expect(reduce(s, { type: 'addPlayer', name: 'x'.repeat(MAX_NAME_LENGTH + 1) })).toBe(s)
  })

  it('addPlayer stops at MAX_PLAYERS', () => {
    const s = inSetup('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')
    expect(reduce(s, { type: 'addPlayer', name: 'I' })).toBe(s)
  })

  it('addPlayer only on setup', () => {
    const s = at('home')
    expect(reduce(s, { type: 'addPlayer', name: 'Dan' })).toBe(s)
  })

  it('removePlayer removes by id', () => {
    const s = reduce(inSetup('Ann', 'Bob', 'Cat'), { type: 'removePlayer', id: 'p2' })
    expect(s.players.map((p) => p.name)).toEqual(['Ann', 'Cat'])
  })

  it('removePlayer ignores unknown ids and other screens', () => {
    const s = inSetup('Ann')
    expect(reduce(s, { type: 'removePlayer', id: 'nope' })).toBe(s)
    const intro = at('intro')
    expect(reduce(intro, { type: 'removePlayer', id: 'p1' })).toBe(intro)
  })

  it('movePlayer reorders', () => {
    const s = reduce(inSetup('Ann', 'Bob', 'Cat'), { type: 'movePlayer', id: 'p3', toIndex: 0 })
    expect(s.players.map((p) => p.name)).toEqual(['Cat', 'Ann', 'Bob'])
    const t = reduce(inSetup('Ann', 'Bob', 'Cat'), { type: 'movePlayer', id: 'p1', toIndex: 2 })
    expect(t.players.map((p) => p.name)).toEqual(['Bob', 'Cat', 'Ann'])
  })

  it('movePlayer rejects out-of-range, same-index, unknown id and other screens', () => {
    const s = inSetup('Ann', 'Bob', 'Cat')
    expect(reduce(s, { type: 'movePlayer', id: 'p1', toIndex: -1 })).toBe(s)
    expect(reduce(s, { type: 'movePlayer', id: 'p1', toIndex: 3 })).toBe(s)
    expect(reduce(s, { type: 'movePlayer', id: 'p1', toIndex: 1.5 })).toBe(s)
    expect(reduce(s, { type: 'movePlayer', id: 'p1', toIndex: 0 })).toBe(s)
    expect(reduce(s, { type: 'movePlayer', id: 'zz', toIndex: 1 })).toBe(s)
    const intro = at('intro')
    expect(reduce(intro, { type: 'movePlayer', id: 'p1', toIndex: 1 })).toBe(intro)
  })

  it('renamePlayer trims and validates', () => {
    const s = inSetup('Ann', 'Bob')
    expect(reduce(s, { type: 'renamePlayer', id: 'p1', name: ' Anna ' }).players[0]).toEqual({
      id: 'p1',
      name: 'Anna',
    })
    expect(reduce(s, { type: 'renamePlayer', id: 'p1', name: 'ANN' }).players[0].name).toBe('ANN')
    expect(reduce(s, { type: 'renamePlayer', id: 'p1', name: 'bob' })).toBe(s)
    expect(reduce(s, { type: 'renamePlayer', id: 'p1', name: '' })).toBe(s)
    expect(reduce(s, { type: 'renamePlayer', id: 'zz', name: 'Zed' })).toBe(s)
    expect(reduce(s, { type: 'renamePlayer', id: 'p1', name: 'Ann' })).toBe(s)
  })

  it('renamePlayer only on setup', () => {
    const s = at('vote')
    expect(reduce(s, { type: 'renamePlayer', id: 'p1', name: 'Zed' })).toBe(s)
  })
})

describe('game flow actions', () => {
  it('startGame needs canStart and setup screen', () => {
    const few = inSetup('Ann', 'Bob')
    expect(reduce(few, { type: 'startGame' })).toBe(few)
    const home = at('home')
    expect(reduce(home, { type: 'startGame' })).toBe(home)
  })

  it('startGame moves to intro at stage 0 with clean votes', () => {
    const s = { ...inSetup('Ann', 'Bob', 'Cat'), stageIndex: 2, votes: [votes([])], endReason: 'host-ended' as const }
    const next = reduce(s, { type: 'startGame' })
    expect(next).toMatchObject({ screen: 'intro', stageIndex: 0, votes: [], endReason: null })
    expect(next.players).toEqual(s.players)
  })

  it('beginVote only from intro', () => {
    expect(reduce(at('intro'), { type: 'beginVote' }).screen).toBe('vote')
    const s = at('ceremony')
    expect(reduce(s, { type: 'beginVote' })).toBe(s)
  })

  it('submitVotes stores votes for the current stage and opens the ceremony', () => {
    const s = at('vote', { stageIndex: 1, votes: [votes(['p1', 'p2'])] })
    const next = reduce(s, { type: 'submitVotes', votes: { p1: 'cutoff', p2: 'accept' } })
    expect(next.screen).toBe('ceremony')
    expect(next.votes).toEqual([votes(['p1', 'p2']), { p1: 'cutoff', p2: 'accept' }])
  })

  it('submitVotes counts missing players as cutoff and drops unknown ids', () => {
    const s = at('vote')
    const next = reduce(s, { type: 'submitVotes', votes: { p1: 'accept', ghost: 'accept' } })
    expect(next.votes[0]).toEqual({ p1: 'accept', p2: 'cutoff', p3: 'cutoff' })
  })

  it('submitVotes only from vote', () => {
    const s = at('intro')
    expect(reduce(s, { type: 'submitVotes', votes: votes(['p1']) })).toBe(s)
  })

  it('continue advances when someone accepted and a stage remains', () => {
    const s = at('ceremony', { votes: [votes(['p1'])] })
    expect(reduce(s, { type: 'continue' })).toMatchObject({ screen: 'intro', stageIndex: 1 })
  })

  it('continue is blocked when nobody accepted', () => {
    const s = at('ceremony', { votes: [votes([])] })
    expect(reduce(s, { type: 'continue' })).toBe(s)
  })

  it('continue is blocked on the last stage', () => {
    const s = at('ceremony', { stageIndex: 2, votes: [votes(['p1']), votes(['p1']), votes(['p1'])] })
    expect(reduce(s, { type: 'continue' })).toBe(s)
  })

  it('continue only from ceremony', () => {
    const s = at('intro', { votes: [votes(['p1'])] })
    expect(reduce(s, { type: 'continue' })).toBe(s)
  })

  it('endHere ends with nobody-accepted', () => {
    const s = at('ceremony', { stageIndex: 1, votes: [votes(['p1']), votes([])] })
    expect(reduce(s, { type: 'endHere' })).toMatchObject({ screen: 'end', endReason: 'nobody-accepted' })
  })

  it('endHere ends with out-of-stages on the last stage', () => {
    const s = at('ceremony', { stageIndex: 2, votes: [votes(['p1', 'p2']), votes(['p1', 'p2']), votes(['p2'])] })
    expect(reduce(s, { type: 'endHere' })).toMatchObject({ screen: 'end', endReason: 'out-of-stages' })
  })

  it('endHere prefers nobody-accepted on the last stage', () => {
    const s = at('ceremony', { stageIndex: 2, votes: [votes(['p1']), votes(['p1']), votes([])] })
    expect(reduce(s, { type: 'endHere' }).endReason).toBe('nobody-accepted')
  })

  it('endHere ends with host-ended otherwise', () => {
    const s = at('ceremony', { votes: [votes(['p1', 'p2'])] })
    expect(reduce(s, { type: 'endHere' })).toMatchObject({ screen: 'end', endReason: 'host-ended' })
  })

  it('endHere only from ceremony', () => {
    const s = at('vote')
    expect(reduce(s, { type: 'endHere' })).toBe(s)
  })

  it('playAgain restarts with the same players', () => {
    const s = at('end', { stageIndex: 1, votes: [votes(['p1']), votes([])], endReason: 'nobody-accepted' })
    const next = reduce(s, { type: 'playAgain' })
    expect(next).toMatchObject({ screen: 'intro', stageIndex: 0, votes: [], endReason: null })
    expect(next.players).toEqual(s.players)
  })

  it('playAgain only from end', () => {
    const s = at('ceremony')
    expect(reduce(s, { type: 'playAgain' })).toBe(s)
  })

  it('newGame returns home with no players and keeps adult confirmation', () => {
    for (const screen of ['setup', 'intro', 'vote', 'ceremony', 'end'] as const) {
      const s = at(screen, { stageIndex: 1, votes: [votes(['p1'])], endReason: 'host-ended' })
      expect(reduce(s, { type: 'newGame' })).toEqual({ ...initialState(), adultConfirmed: true })
    }
  })

  it('submitVotes stores only active players and drops eliminated ones', () => {
    const s = at('vote', { stageIndex: 1, votes: [votes(['p1', 'p2'])] })
    const next = reduce(s, { type: 'submitVotes', votes: votes(['p1', 'p2', 'p3']) })
    expect(next.votes[1]).toEqual({ p1: 'accept', p2: 'accept' })
  })

  it('submitVotes counts missing active players as cutoff', () => {
    const s = at('vote', { stageIndex: 1, votes: [votes(['p1', 'p2'])] })
    const next = reduce(s, { type: 'submitVotes', votes: { p2: 'accept', p3: 'accept' } })
    expect(next.votes[1]).toEqual({ p1: 'cutoff', p2: 'accept' })
  })

  it('submitVotes stores an empty record when nobody is active', () => {
    const s = at('vote', { stageIndex: 1, votes: [votes([])] })
    expect(reduce(s, { type: 'submitVotes', votes: votes(['p1', 'p2', 'p3']) }).votes[1]).toEqual({})
  })

  it('an eliminated player stays out for the rest of the game', () => {
    const end = run(
      at('intro'),
      { type: 'beginVote' },
      { type: 'submitVotes', votes: votes(['p1', 'p2']) },
      { type: 'continue' },
      { type: 'beginVote' },
      { type: 'submitVotes', votes: votes(['p1', 'p2', 'p3']) },
      { type: 'continue' },
      { type: 'beginVote' },
      { type: 'submitVotes', votes: votes(['p1', 'p3']) },
    )
    expect(end.votes).toEqual([votes(['p1', 'p2']), { p1: 'accept', p2: 'accept' }, { p1: 'accept', p2: 'cutoff' }])
    expect(activePlayers(end).map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(stageOutcome(end, STAGES)).toMatchObject({ accepters: ['p1'], wentOut: ['p2'], loneHoldout: true })
  })

  it('a full game reaches the end', () => {
    const end = run(
      initialState(),
      { type: 'confirmAdult' },
      { type: 'openSetup' },
      { type: 'addPlayer', name: 'Ann' },
      { type: 'addPlayer', name: 'Bob' },
      { type: 'addPlayer', name: 'Cat' },
      { type: 'startGame' },
      { type: 'beginVote' },
      { type: 'submitVotes', votes: votes(['p1', 'p2', 'p3']) },
      { type: 'continue' },
      { type: 'beginVote' },
      { type: 'submitVotes', votes: votes(['p1', 'p2']) },
      { type: 'continue' },
      { type: 'beginVote' },
      { type: 'submitVotes', votes: votes(['p1']) },
      { type: 'continue' },
      { type: 'endHere' },
    )
    expect(end).toMatchObject({ screen: 'end', endReason: 'out-of-stages', stageIndex: 2 })
    expect(computeResults(end)).toEqual({
      personalCutoff: { p1: 2, p2: 1, p3: 0 },
      groupCutoff: 1,
      lastStanding: ['p1'],
      stagesPlayed: 3,
    })
  })

  it('an unknown action returns the same state', () => {
    const s = at('home')
    expect(reduce(s, { type: 'nope' } as unknown as GameAction)).toBe(s)
  })
})

describe('activePlayers', () => {
  it('everyone is active at stage 0', () => {
    expect(activePlayers(at('vote')).map((p) => p.id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('keeps only players who accepted every earlier stage', () => {
    const s = at('vote', { stageIndex: 2, votes: [votes(['p1', 'p2']), votes(['p1'])] })
    expect(activePlayers(s).map((p) => p.id)).toEqual(['p1'])
    expect(activePlayers(s, 1).map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(activePlayers(s, 0).map((p) => p.id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('ignores accepts after a cutoff from older saves', () => {
    const s = at('vote', { stageIndex: 2, votes: [votes(['p1']), votes(['p1', 'p2', 'p3'])] })
    expect(activePlayers(s).map((p) => p.id)).toEqual(['p1'])
  })

  it('keeps player order', () => {
    const s = at('vote', { stageIndex: 1, votes: [votes(['p3', 'p1'])] })
    expect(activePlayers(s).map((p) => p.id)).toEqual(['p1', 'p3'])
  })
})

describe('eliminatedAt', () => {
  it('is the first stage the player cut off', () => {
    const s = at('ceremony', { stageIndex: 2, votes: [votes(['p1', 'p2']), votes(['p1']), { p1: 'accept' }] })
    expect(eliminatedAt(s, 'p1')).toBeNull()
    expect(eliminatedAt(s, 'p2')).toBe(1)
    expect(eliminatedAt(s, 'p3')).toBe(0)
  })

  it('ignores later accepts from older saves', () => {
    const s = at('end', { votes: [votes(['p2']), votes(['p1', 'p2']), votes(['p1'])] })
    expect(eliminatedAt(s, 'p1')).toBe(0)
    expect(eliminatedAt(s, 'p2')).toBe(2)
  })

  it('is null before any votes are recorded', () => {
    expect(eliminatedAt(at('vote'), 'p1')).toBeNull()
  })
})

describe('stageOutcome', () => {
  it('lists accepters in player order', () => {
    const s = at('ceremony', { votes: [votes(['p3', 'p1'])] })
    expect(stageOutcome(s, STAGES).accepters).toEqual(['p1', 'p3'])
  })

  it('flags a lone holdout', () => {
    const o = stageOutcome(at('ceremony', { votes: [votes(['p2'])] }), STAGES)
    expect(o).toMatchObject({ loneHoldout: true, unanimous: false, nobody: false, canContinue: true })
  })

  it('needs at least two players for a lone holdout', () => {
    const s = at('ceremony', { players: players('Solo'), votes: [{ p1: 'accept' }] })
    expect(stageOutcome(s, STAGES)).toMatchObject({ loneHoldout: false, unanimous: false })
  })

  it('keeps the lone holdout spotlight on the last player left every stage', () => {
    const s = at('ceremony', { stageIndex: 2, votes: [votes(['p1', 'p2']), votes(['p1']), { p1: 'accept' }] })
    expect(stageOutcome(s, STAGES, 1)).toMatchObject({ accepters: ['p1'], loneHoldout: true, unanimous: false })
    expect(stageOutcome(s, STAGES, 2)).toMatchObject({ accepters: ['p1'], loneHoldout: true, unanimous: false })
  })

  it('is unanimous when every active player accepts and at least two remain', () => {
    const s = at('ceremony', { stageIndex: 1, votes: [votes(['p1', 'p2']), { p1: 'accept', p2: 'accept' }] })
    expect(stageOutcome(s, STAGES)).toMatchObject({ unanimous: true, loneHoldout: false, wentOut: [] })
  })

  it('ignores accepts from eliminated players in older saves', () => {
    const s = at('ceremony', { stageIndex: 1, votes: [votes(['p1', 'p2']), votes(['p1', 'p2', 'p3'])] })
    expect(stageOutcome(s, STAGES)).toMatchObject({ accepters: ['p1', 'p2'], unanimous: true })
  })

  it('lists who went out this stage', () => {
    const s = at('ceremony', { stageIndex: 1, votes: [votes(['p1', 'p2']), votes(['p2'])] })
    expect(stageOutcome(s, STAGES)).toMatchObject({ accepters: ['p2'], wentOut: ['p1'] })
  })

  it('is nobody when the last active player cuts off', () => {
    const s = at('ceremony', { stageIndex: 2, votes: [votes(['p1', 'p2']), votes(['p1']), { p1: 'cutoff' }] })
    expect(stageOutcome(s, 4)).toMatchObject({
      accepters: [],
      wentOut: ['p1'],
      nobody: true,
      loneHoldout: false,
      unanimous: false,
      canContinue: false,
    })
    expect(createReducer(4)(s, { type: 'endHere' }).endReason).toBe('nobody-accepted')
  })

  it('flags unanimous acceptance', () => {
    const o = stageOutcome(at('ceremony', { votes: [votes(['p1', 'p2', 'p3'])] }), STAGES)
    expect(o).toMatchObject({ unanimous: true, loneHoldout: false, nobody: false })
  })

  it('flags nobody accepting and blocks continue', () => {
    const o = stageOutcome(at('ceremony', { votes: [votes([])] }), STAGES)
    expect(o).toMatchObject({ nobody: true, unanimous: false, loneHoldout: false, canContinue: false })
    expect(o.wentOut).toEqual(['p1', 'p2', 'p3'])
  })

  it('treats a stage without votes as nobody', () => {
    expect(stageOutcome(at('intro'), STAGES)).toMatchObject({ accepters: [], nobody: true })
  })

  it('knows the last stage', () => {
    const s = at('ceremony', { stageIndex: 2, votes: [votes(['p1']), votes(['p1']), votes(['p1'])] })
    expect(stageOutcome(s, STAGES)).toMatchObject({ isLastStage: true, canContinue: false })
    expect(stageOutcome(s, STAGES, 1)).toMatchObject({ isLastStage: false, canContinue: true })
  })

  it('cannot continue with zero stages', () => {
    expect(stageOutcome(at('ceremony', { votes: [votes(['p1'])] }), 0).canContinue).toBe(false)
  })
})

describe('computeResults', () => {
  it('personal cutoff is the last stage accepted before going out', () => {
    const s = at('end', { stageIndex: 2, votes: [votes(['p1', 'p2']), votes(['p1']), { p1: 'accept' }] })
    expect(computeResults(s).personalCutoff).toEqual({ p1: 2, p2: 0, p3: null })
  })

  it('accepts after a cutoff in older saves do not count', () => {
    const s = at('end', { votes: [votes(['p1']), votes([]), votes(['p1', 'p2'])] })
    expect(computeResults(s)).toMatchObject({
      personalCutoff: { p1: 0, p2: null, p3: null },
      groupCutoff: null,
      lastStanding: ['p1'],
    })
  })

  it('group cutoff is the last stage where a strict majority of all players accepted', () => {
    const s = at('end', { votes: [votes(['p1', 'p2', 'p3']), votes(['p1', 'p2']), { p1: 'accept', p2: 'cutoff' }] })
    expect(computeResults(s).groupCutoff).toBe(1)
  })

  it('group cutoff ignores accepts from eliminated players in older saves', () => {
    const s = at('end', { votes: [votes(['p1', 'p2']), votes(['p1']), votes(['p1', 'p3'])] })
    expect(computeResults(s).groupCutoff).toBe(0)
  })

  it('half is not a majority', () => {
    const four = players('A', 'B', 'C', 'D')
    const ids = four.map((p) => p.id)
    const s = at('end', {
      players: four,
      votes: [votes(['p1', 'p2', 'p3'], ids), votes(['p1', 'p2'], ids)],
    })
    expect(computeResults(s).groupCutoff).toBe(0)
  })

  it('group cutoff is null when no stage had a majority', () => {
    const s = at('end', { votes: [votes(['p1']), votes(['p2'])] })
    expect(computeResults(s).groupCutoff).toBeNull()
  })

  it('last standing shares ties', () => {
    const s = at('end', { votes: [votes(['p1', 'p2', 'p3']), votes(['p1', 'p3'])] })
    expect(computeResults(s).lastStanding).toEqual(['p1', 'p3'])
  })

  it('last standing is the final survivor', () => {
    const s = at('end', { stageIndex: 2, votes: [votes(['p1', 'p2']), { p1: 'accept', p2: 'cutoff' }, { p1: 'accept' }] })
    expect(computeResults(s)).toEqual({
      personalCutoff: { p1: 2, p2: 0, p3: null },
      groupCutoff: 0,
      lastStanding: ['p1'],
      stagesPlayed: 3,
    })
  })

  it('players who go out together on the deepest stage share last standing', () => {
    const s = at('end', {
      stageIndex: 2,
      votes: [votes(['p1', 'p2', 'p3']), { p1: 'cutoff', p2: 'accept', p3: 'accept' }, { p2: 'cutoff', p3: 'cutoff' }],
      endReason: 'nobody-accepted',
    })
    expect(computeResults(s)).toMatchObject({
      personalCutoff: { p1: 0, p2: 1, p3: 1 },
      groupCutoff: 1,
      lastStanding: ['p2', 'p3'],
    })
  })

  it('never-accepted gives null cutoffs and nobody standing', () => {
    const s = at('end', { votes: [votes([])], endReason: 'nobody-accepted' })
    expect(computeResults(s)).toEqual({
      personalCutoff: { p1: null, p2: null, p3: null },
      groupCutoff: null,
      lastStanding: [],
      stagesPlayed: 1,
    })
  })

  it('counts stages played', () => {
    expect(computeResults(at('end', { votes: [votes(['p1']), votes(['p1'])] })).stagesPlayed).toBe(2)
    expect(computeResults(at('setup')).stagesPlayed).toBe(0)
  })
})
