import type { Board, BoardSize, GameResult, GameStatus, Move, Player } from '@tic-tac-toe/shared'

export function createEmptyBoard(size: BoardSize = 3): Board {
  return Array(size * size).fill(null)
}

export function buildWinningLines(size: BoardSize): number[][] {
  const lines: number[][] = []

  for (let row = 0; row < size; row++) {
    lines.push(Array.from({ length: size }, (_, col) => row * size + col))
  }
  for (let col = 0; col < size; col++) {
    lines.push(Array.from({ length: size }, (_, row) => row * size + col))
  }
  lines.push(Array.from({ length: size }, (_, i) => i * size + i))
  lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)))

  return lines
}

export function boardSize(board: Board): BoardSize {
  return Math.sqrt(board.length) as BoardSize
}

export function evaluateBoard(board: Board): GameResult {
  const lines = buildWinningLines(boardSize(board))
  for (const line of lines) {
    const first = board[line[0]]
    if (first && line.every((index) => board[index] === first)) {
      return { status: 'won', winner: first as Player, winningLine: line }
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { status: 'draw', winner: null, winningLine: null }
  }
  return { status: 'in_progress', winner: null, winningLine: null }
}

export function nextPlayer(player: Player): Player {
  return player === 'X' ? 'O' : 'X'
}

export class InvalidMoveError extends Error {}
export class CannotUndoError extends Error {}

const HUMAN_PLAYER: Player = 'X'

export function undoLastTurn(
  board: Board,
  moveHistory: Move[],
  vsBot: boolean
): { board: Board; moveHistory: Move[]; currentPlayer: Player } {
  const nextBoard = [...board]
  const nextHistory = [...moveHistory]
  const lastMove = nextHistory.pop()
  if (!lastMove) {
    throw new CannotUndoError('No moves to undo')
  }

  nextBoard[lastMove.position] = null

  if (vsBot && lastMove.player !== HUMAN_PLAYER) {
    const humanMove = nextHistory.pop()
    if (humanMove) nextBoard[humanMove.position] = null
  }

  return {
    board: nextBoard,
    moveHistory: nextHistory,
    currentPlayer: vsBot ? HUMAN_PLAYER : lastMove.player,
  }
}

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
  if (position < 0 || position > board.length - 1) {
    throw new InvalidMoveError('Position out of bounds')
  }
  if (board[position] !== null) {
    throw new InvalidMoveError('Cell already taken')
  }
  const next = [...board]
  next[position] = player
  return next
}
