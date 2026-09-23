import type { Board, GameResult, Move, Player, SubBoardResult } from '@tic-tac-toe/shared'
import { buildWinningLines, InvalidMoveError } from './logic'

export const SUB_BOARD_COUNT = 9
export const SUB_BOARD_CELLS = 9
export const ULTIMATE_BOARD_CELLS = SUB_BOARD_COUNT * SUB_BOARD_CELLS

const LINES = buildWinningLines(3)

export function createEmptyUltimateBoard(): Board {
  return Array(ULTIMATE_BOARD_CELLS).fill(null)
}

export function subBoardOf(position: number): number {
  return Math.floor(position / SUB_BOARD_CELLS)
}

export function cellInSubBoard(position: number): number {
  return position % SUB_BOARD_CELLS
}

export function subBoardCells(board: Board, subBoard: number): Board {
  const start = subBoard * SUB_BOARD_CELLS
  return board.slice(start, start + SUB_BOARD_CELLS)
}

function lineWinner(cells: readonly (SubBoardResult | undefined)[]): { winner: Player; line: number[] } | null {
  for (const line of LINES) {
    const first = cells[line[0]]
    if ((first === 'X' || first === 'O') && line.every((index) => cells[index] === first)) {
      return { winner: first, line }
    }
  }
  return null
}

export function evaluateSubBoard(cells: Board): SubBoardResult {
  const won = lineWinner(cells)
  if (won) return won.winner
  return cells.every((cell) => cell !== null) ? 'draw' : null
}

export function evaluateSubBoards(board: Board): SubBoardResult[] {
  return Array.from({ length: SUB_BOARD_COUNT }, (_, index) => evaluateSubBoard(subBoardCells(board, index)))
}

/** Game result on the meta board; `winningLine` holds sub-board indices. */
export function evaluateUltimateBoard(board: Board, subBoardResults = evaluateSubBoards(board)): GameResult {
  const won = lineWinner(subBoardResults)
  if (won) return { status: 'won', winner: won.winner, winningLine: won.line }
  if (subBoardResults.every((result) => result !== null)) {
    return { status: 'draw', winner: null, winningLine: null }
  }
  return { status: 'in_progress', winner: null, winningLine: null }
}

/**
 * The cell played inside a sub-board picks the sub-board the opponent must
 * play in next. When that sub-board is already decided, any open one is allowed.
 */
export function activeSubBoardAfter(lastPosition: number | undefined, subBoardResults: SubBoardResult[]): number | null {
  if (lastPosition === undefined) return null
  const target = cellInSubBoard(lastPosition)
  return subBoardResults[target] === null ? target : null
}

export function activeSubBoardFor(moveHistory: Move[], subBoardResults: SubBoardResult[]): number | null {
  return activeSubBoardAfter(moveHistory.at(-1)?.position, subBoardResults)
}

export function legalUltimateMoves(
  board: Board,
  activeSubBoard: number | null,
  subBoardResults: SubBoardResult[] = evaluateSubBoards(board)
): number[] {
  const positions: number[] = []
  for (let subBoard = 0; subBoard < SUB_BOARD_COUNT; subBoard++) {
    if (activeSubBoard !== null && subBoard !== activeSubBoard) continue
    if (subBoardResults[subBoard] !== null) continue
    for (let cell = 0; cell < SUB_BOARD_CELLS; cell++) {
      const position = subBoard * SUB_BOARD_CELLS + cell
      if (board[position] === null) positions.push(position)
    }
  }
  return positions
}

export function assertUltimateMoveAllowed(board: Board, position: number, activeSubBoard: number | null): void {
  const subBoard = subBoardOf(position)
  if (activeSubBoard !== null && subBoard !== activeSubBoard) {
    throw new InvalidMoveError(`Must play in sub-board ${activeSubBoard}`)
  }
  if (evaluateSubBoard(subBoardCells(board, subBoard)) !== null) {
    throw new InvalidMoveError('Sub-board already decided')
  }
}
