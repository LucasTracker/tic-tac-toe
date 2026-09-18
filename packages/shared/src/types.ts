export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = Cell[]

export type GameStatus = 'in_progress' | 'won' | 'draw' | 'timeout'

export interface GameResult {
  status: GameStatus
  winner: Player | null
  winningLine: number[] | null
}

export type BotDifficulty = 'easy' | 'medium' | 'unbeatable'

export type BoardSize = 3 | 4 | 5
export type TimeLimitSeconds = 0 | 10 | 30 | 60

export interface GameState {
  id: string
  board: Board
  size: BoardSize
  currentPlayer: Player
  status: GameStatus
  winner: Player | null
  winningLine: number[] | null
  vsBot: boolean
  botDifficulty: BotDifficulty | null
  /** Zero means that the game has no per-turn time limit. */
  timeLimitSeconds: TimeLimitSeconds
  /** Unix timestamp (milliseconds) at which the current turn began. */
  turnStartedAt: number
  /** Player that ran out of time, when status is `timeout`. */
  timedOutPlayer: Player | null
}

export interface CreateGameOptions {
  size?: BoardSize
  vsBot?: boolean
  botDifficulty?: BotDifficulty
  timeLimitSeconds?: TimeLimitSeconds
}

export interface Move {
  position: number
  player: Player
}

export interface ScoreBoard {
  xWins: number
  oWins: number
  draws: number
}
