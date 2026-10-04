import { isStageUnlocked } from '../paywall'
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS } from './types'
import type { EndReason, GameAction, GameResults, GameState, Player, PlayerId, StageVotes } from './types'

export interface StageOutcome {
  accepters: PlayerId[]
  wentOut: PlayerId[]
  loneHoldout: boolean
  unanimous: boolean
  nobody: boolean
  isLastStage: boolean
  canContinue: boolean
}

export function initialState(): GameState {
  return {
    screen: 'home',
    adultConfirmed: false,
    players: [],
    stageIndex: 0,
    votes: [],
    endReason: null,
  }
}

export function validatePlayerName(players: Player[], name: string, exceptId?: PlayerId): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Enter a name.'
  if (trimmed.length > MAX_NAME_LENGTH) return `Keep it to ${MAX_NAME_LENGTH} characters.`
  const lower = trimmed.toLowerCase()
  if (players.some((p) => p.id !== exceptId && p.name.trim().toLowerCase() === lower)) {
    return 'That name is taken.'
  }
  return null
}

export function canStart(players: Player[]): boolean {
  return (
    players.length >= MIN_PLAYERS &&
    players.length <= MAX_PLAYERS &&
    players.every((p) => validatePlayerName(players, p.name, p.id) === null)
  )
}

export function eliminatedAt(state: GameState, playerId: PlayerId): number | null {
  const index = state.votes.findIndex((v) => v[playerId] !== 'accept')
  return index === -1 ? null : index
}

export function activePlayers(state: GameState, stageIndex = state.stageIndex): Player[] {
  return state.players.filter((p) => (eliminatedAt(state, p.id) ?? Infinity) >= stageIndex)
}

export function stageOutcome(state: GameState, stageCount: number, stageIndex = state.stageIndex): StageOutcome {
  const votes = state.votes[stageIndex] ?? {}
  const active = activePlayers(state, stageIndex).map((p) => p.id)
  const accepters = active.filter((id) => votes[id] === 'accept')
  const nobody = accepters.length === 0
  const isLastStage = stageIndex >= stageCount - 1
  return {
    accepters,
    wentOut: active.filter((id) => votes[id] !== 'accept'),
    loneHoldout: accepters.length === 1 && state.players.length >= 2,
    unanimous: active.length >= 2 && accepters.length === active.length,
    nobody,
    isLastStage,
    canContinue: !nobody && !isLastStage && isStageUnlocked(stageIndex + 1),
  }
}

export function computeResults(state: GameState): GameResults {
  const personalCutoff: Record<PlayerId, number | null> = {}
  for (const p of state.players) {
    const out = eliminatedAt(state, p.id) ?? state.votes.length
    personalCutoff[p.id] = out === 0 ? null : out - 1
  }
  const majority = state.votes.findLastIndex(
    (_v, stage) =>
      state.players.filter((p) => (personalCutoff[p.id] ?? -1) >= stage).length * 2 > state.players.length,
  )
  const groupCutoff = majority === -1 ? null : majority
  const cutoffs = Object.values(personalCutoff).filter((c): c is number => c !== null)
  const deepest = cutoffs.length ? Math.max(...cutoffs) : null
  return {
    personalCutoff,
    groupCutoff,
    lastStanding: deepest === null ? [] : state.players.filter((p) => personalCutoff[p.id] === deepest).map((p) => p.id),
    stagesPlayed: state.votes.length,
  }
}

export function createReducer(stageCount: number): (state: GameState, action: GameAction) => GameState {
  return function reducer(state, action) {
    switch (action.type) {
      case 'confirmAdult':
        return state.adultConfirmed ? state : { ...state, adultConfirmed: true }
      case 'openSetup':
        return state.screen === 'home' && state.adultConfirmed ? { ...state, screen: 'setup' } : state
      case 'openCredits':
        return state.screen === 'home' ? { ...state, screen: 'credits' } : state
      case 'goHome':
        return state.screen === 'setup' || state.screen === 'credits' ? { ...state, screen: 'home' } : state
      case 'addPlayer':
        return state.screen === 'setup' ? addPlayer(state, action.name) : state
      case 'removePlayer':
        return state.screen === 'setup' && hasPlayer(state, action.id)
          ? { ...state, players: state.players.filter((p) => p.id !== action.id) }
          : state
      case 'movePlayer':
        return state.screen === 'setup' ? movePlayer(state, action.id, action.toIndex) : state
      case 'renamePlayer':
        return state.screen === 'setup' ? renamePlayer(state, action.id, action.name) : state
      case 'startGame':
        return state.screen === 'setup' && canStart(state.players) ? restart(state) : state
      case 'beginVote':
        return state.screen === 'intro' ? { ...state, screen: 'vote' } : state
      case 'submitVotes':
        return state.screen === 'vote' ? submitVotes(state, action.votes) : state
      case 'continue':
        return state.screen === 'ceremony' && stageOutcome(state, stageCount).canContinue
          ? { ...state, screen: 'intro', stageIndex: state.stageIndex + 1 }
          : state
      case 'endHere':
        return state.screen === 'ceremony' ? { ...state, screen: 'end', endReason: endReason(state, stageCount) } : state
      case 'playAgain':
        return state.screen === 'end' ? restart(state) : state
      case 'newGame':
        return { ...initialState(), adultConfirmed: state.adultConfirmed }
      default:
        return state
    }
  }
}

function hasPlayer(state: GameState, id: PlayerId): boolean {
  return state.players.some((p) => p.id === id)
}

function nextPlayerId(players: Player[]): PlayerId {
  const max = players.reduce((n, p) => Math.max(n, Number(/^p(\d+)$/.exec(p.id)?.[1] ?? 0)), 0)
  return `p${max + 1}`
}

function addPlayer(state: GameState, name: string): GameState {
  if (state.players.length >= MAX_PLAYERS || validatePlayerName(state.players, name) !== null) return state
  return { ...state, players: [...state.players, { id: nextPlayerId(state.players), name: name.trim() }] }
}

function movePlayer(state: GameState, id: PlayerId, toIndex: number): GameState {
  const from = state.players.findIndex((p) => p.id === id)
  if (from === -1 || !Number.isInteger(toIndex) || toIndex < 0 || toIndex >= state.players.length || toIndex === from) {
    return state
  }
  const players = state.players.toSpliced(from, 1)
  return { ...state, players: players.toSpliced(toIndex, 0, state.players[from]) }
}

function renamePlayer(state: GameState, id: PlayerId, name: string): GameState {
  const trimmed = name.trim()
  const current = state.players.find((p) => p.id === id)
  if (!current || current.name === trimmed || validatePlayerName(state.players, name, id) !== null) return state
  return { ...state, players: state.players.map((p) => (p.id === id ? { ...p, name: trimmed } : p)) }
}

function restart(state: GameState): GameState {
  return { ...state, screen: 'intro', stageIndex: 0, votes: [], endReason: null }
}

function submitVotes(state: GameState, votes: StageVotes): GameState {
  const stageVotes: StageVotes = Object.fromEntries(
    activePlayers(state).map((p) => [p.id, votes[p.id] === 'accept' ? 'accept' : 'cutoff']),
  )
  return { ...state, screen: 'ceremony', votes: [...state.votes.slice(0, state.stageIndex), stageVotes] }
}

function endReason(state: GameState, stageCount: number): EndReason {
  const outcome = stageOutcome(state, stageCount)
  if (outcome.nobody) return 'nobody-accepted'
  if (outcome.isLastStage) return 'out-of-stages'
  return 'host-ended'
}
