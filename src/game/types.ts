export type PlayerId = string

export interface Player {
  id: PlayerId
  name: string
}

export type Vote = 'accept' | 'cutoff'

export type StageVotes = Record<PlayerId, Vote>

export type Screen = 'home' | 'setup' | 'intro' | 'vote' | 'ceremony' | 'end' | 'credits'

export type EndReason = 'nobody-accepted' | 'out-of-stages' | 'host-ended'

export interface GameState {
  screen: Screen
  adultConfirmed: boolean
  players: Player[]
  stageIndex: number
  votes: StageVotes[]
  endReason: EndReason | null
}

export type GameAction =
  | { type: 'confirmAdult' }
  | { type: 'openSetup' }
  | { type: 'openCredits' }
  | { type: 'goHome' }
  | { type: 'addPlayer'; name: string }
  | { type: 'removePlayer'; id: PlayerId }
  | { type: 'movePlayer'; id: PlayerId; toIndex: number }
  | { type: 'renamePlayer'; id: PlayerId; name: string }
  | { type: 'startGame' }
  | { type: 'beginVote' }
  | { type: 'submitVotes'; votes: StageVotes }
  | { type: 'continue' }
  | { type: 'endHere' }
  | { type: 'playAgain' }
  | { type: 'newGame' }

export interface GameResults {
  personalCutoff: Record<PlayerId, number | null>
  groupCutoff: number | null
  lastStanding: PlayerId[]
  stagesPlayed: number
}

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 8
export const MAX_NAME_LENGTH = 16
