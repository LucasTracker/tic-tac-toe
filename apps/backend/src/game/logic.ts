import type { Board, GameResult, GameStatus, Player } from '@tic-tac-toe/shared'

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function createEmptyBoard(): Board {
  return Array(9).fill(null)
}

export function evaluateBoard(board: Board): GameResult {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { status: 'won', winner: board[a] as Player }
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { status: 'draw', winner: null }
  }
  return { status: 'in_progress', winner: null }
}

export function nextPlayer(player: Player): Player {
  return player === 'X' ? 'O' : 'X'
}

export class InvalidMoveError extends Error {}

export function applyMove(
  board: Board,
  position: number,
  player: Player,
  currentPlayer: Player,
  status: GameStatus
): Board {
  if (status !== 'in_progress') {
    throw new InvalidMoveError('Game is already finished')
  }
  if (player !== currentPlayer) {
    throw new InvalidMoveError('Not your turn')
  }
  if (position < 0 || position > 8) {
    throw new InvalidMoveError('Position out of bounds')
  }
  if (board[position] !== null) {
    throw new InvalidMoveError('Cell already taken')
  }
  const next = [...board]
  next[position] = player
  return next
}
