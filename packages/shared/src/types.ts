export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = Cell[]

export type GameStatus = 'in_progress' | 'won' | 'draw'

export interface GameResult {
  status: GameStatus
  winner: Player | null
  winningLine: number[] | null
}

export type BotDifficulty = 'easy' | 'medium' | 'unbeatable'

export interface GameState {
  id: string
  board: Board
  currentPlayer: Player
  status: GameStatus
  winner: Player | null
  winningLine: number[] | null
  vsBot: boolean
  botDifficulty: BotDifficulty | null
}

export interface CreateGameOptions {
  vsBot?: boolean
  botDifficulty?: BotDifficulty
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
