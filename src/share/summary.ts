import type { Stage } from '../content/types'
import type { EndReason, GameResults, Player, PlayerId } from '../game/types'

export const NEVER_ACCEPTED = 'Rejected their own species'
export const NO_GROUP_CUTOFF = "You didn't even make it past Homo sapiens"

export interface RankedPlayer {
  id: PlayerId
  name: string
  rank: number
  cutoff: number | null
  label: string
  crowned: boolean
}

export interface ResultsSummary {
  group: Stage | null
  groupIndex: number | null
  crowned: string[]
  ranking: RankedPlayer[]
}

export interface SummaryInput {
  results: GameResults
  players: Player[]
  stages: Stage[]
  hideNames: boolean
}

export function displayNames(players: Player[], hideNames: boolean): Record<PlayerId, string> {
  return Object.fromEntries(players.map((p, i) => [p.id, hideNames ? `Player ${i + 1}` : p.name]))
}

export function summarize({ results, players, stages, hideNames }: SummaryInput): ResultsSummary {
  const names = displayNames(players, hideNames)
  const crowned = new Set(results.lastStanding)
  const depth = (id: PlayerId) => results.personalCutoff[id] ?? -1
  const sorted = players.toSorted((a, b) => depth(b.id) - depth(a.id))
  const ranking = sorted.map((p) => {
    const cutoff = results.personalCutoff[p.id] ?? null
    return {
      id: p.id,
      name: names[p.id],
      rank: sorted.findIndex((q) => depth(q.id) === depth(p.id)) + 1,
      cutoff,
      label: cutoff === null ? NEVER_ACCEPTED : (stages[cutoff]?.species ?? NEVER_ACCEPTED),
      crowned: crowned.has(p.id),
    }
  })
  const groupIndex = results.groupCutoff
  return {
    group: groupIndex === null ? null : (stages[groupIndex] ?? null),
    groupIndex,
    crowned: ranking.filter((r) => r.crowned).map((r) => r.name),
    ranking,
  }
}

export function endReasonLine(reason: EndReason | null, stagesPlayed: number, stages: Stage[]): string | null {
  switch (reason) {
    case 'nobody-accepted':
      return `Not a single bone accepted at ${stages[stagesPlayed - 1]?.species ?? 'the last stage'}. Lights out.`
    case 'out-of-stages':
      return 'You went all the way back 7 million years.'
    case 'host-ended':
      return `The host called it after ${stagesPlayed} ${stagesPlayed === 1 ? 'stage' : 'stages'}.`
    default:
      return null
  }
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}
