import type { EndReason, GameState, Player, Screen, StageVotes } from './types'

const KEY = 'will-you-accept-this-bone:game'
const VERSION = 1

const SCREENS: readonly Screen[] = ['home', 'setup', 'intro', 'vote', 'ceremony', 'end', 'credits']
const END_REASONS: readonly EndReason[] = ['nobody-accepted', 'out-of-stages', 'host-ended']

export function saveState(state: GameState, storage?: Storage): void {
  try {
    (storage ?? sessionStorage).setItem(KEY, JSON.stringify({ version: VERSION, state }))
  } catch {
    return
  }
}

export function loadState(storage?: Storage): GameState | null {
  try {
    const raw = (storage ?? sessionStorage).getItem(KEY)
    if (raw === null) return null
    const payload: unknown = JSON.parse(raw)
    if (!isRecord(payload) || payload.version !== VERSION) return null
    return parseState(payload.state)
  } catch {
    return null
  }
}

export function clearState(storage?: Storage): void {
  try {
    (storage ?? sessionStorage).removeItem(KEY)
  } catch {
    return
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePlayers(value: unknown): Player[] | null {
  if (!Array.isArray(value)) return null
  const players = value.filter(
    (p): p is Player => isRecord(p) && typeof p.id === 'string' && typeof p.name === 'string',
  )
  if (players.length !== value.length || new Set(players.map((p) => p.id)).size !== players.length) return null
  return players.map(({ id, name }) => ({ id, name }))
}

function parseVotes(value: unknown): StageVotes[] | null {
  if (!Array.isArray(value)) return null
  const valid = value.every(
    (v) => isRecord(v) && Object.values(v).every((vote) => vote === 'accept' || vote === 'cutoff'),
  )
  return valid ? value.map((v: StageVotes) => ({ ...v })) : null
}

function parseState(value: unknown): GameState | null {
  if (!isRecord(value)) return null
  const { screen, adultConfirmed, stageIndex, endReason } = value
  const players = parsePlayers(value.players)
  const votes = parseVotes(value.votes)
  if (
    !SCREENS.includes(screen as Screen) ||
    typeof adultConfirmed !== 'boolean' ||
    !Number.isInteger(stageIndex) ||
    (stageIndex as number) < 0 ||
    !players ||
    !votes ||
    !(endReason === null || END_REASONS.includes(endReason as EndReason))
  ) {
    return null
  }
  return {
    screen: screen as Screen,
    adultConfirmed,
    players,
    stageIndex: stageIndex as number,
    votes,
    endReason: endReason as EndReason | null,
  }
}
