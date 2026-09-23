import { describe, expect, it } from 'vitest'
import type { Board, Player } from '@tic-tac-toe/shared'
import { InvalidMoveError } from './logic'
import {
  activeSubBoardAfter,
  assertUltimateMoveAllowed,
  createEmptyUltimateBoard,
  evaluateSubBoards,
  evaluateUltimateBoard,
  legalUltimateMoves,
} from './ultimate'

function fillSubBoard(board: Board, subBoard: number, cells: (Player | null)[]): void {
  cells.forEach((cell, index) => {
    board[subBoard * 9 + index] = cell
  })
}

const X_WINS_ROW: (Player | null)[] = ['X', 'X', 'X', null, null, null, null, null, null]
const DRAWN: Player[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']

describe('evaluateSubBoards', () => {
  it('reports won, drawn and open sub-boards', () => {
    const board = createEmptyUltimateBoard()
    fillSubBoard(board, 0, X_WINS_ROW)
    fillSubBoard(board, 1, DRAWN)

    const results = evaluateSubBoards(board)

    expect(results[0]).toBe('X')
    expect(results[1]).toBe('draw')
    expect(results.slice(2)).toEqual(Array(7).fill(null))
  })
})

describe('evaluateUltimateBoard', () => {
  it('is in progress on an empty board', () => {
    expect(evaluateUltimateBoard(createEmptyUltimateBoard()).status).toBe('in_progress')
  })

  it('wins with three sub-boards in a row and returns their indices', () => {
    const board = createEmptyUltimateBoard()
    for (const subBoard of [2, 4, 6]) fillSubBoard(board, subBoard, X_WINS_ROW)

    expect(evaluateUltimateBoard(board)).toEqual({ status: 'won', winner: 'X', winningLine: [2, 4, 6] })
  })

  it('does not count drawn sub-boards towards a line', () => {
    const board = createEmptyUltimateBoard()
    fillSubBoard(board, 0, X_WINS_ROW)
    fillSubBoard(board, 1, X_WINS_ROW)
    fillSubBoard(board, 2, DRAWN)

    expect(evaluateUltimateBoard(board).status).toBe('in_progress')
  })

  it('is a draw once every sub-board is decided without a line', () => {
    const board = createEmptyUltimateBoard()
    for (let subBoard = 0; subBoard < 9; subBoard++) fillSubBoard(board, subBoard, DRAWN)

    expect(evaluateUltimateBoard(board)).toEqual({ status: 'draw', winner: null, winningLine: null })
  })
})

describe('activeSubBoardAfter', () => {
  it('allows any sub-board before the first move', () => {
    expect(activeSubBoardAfter(undefined, Array(9).fill(null))).toBeNull()
  })

  it('sends the opponent to the sub-board matching the cell played', () => {
    // Cell 5 of sub-board 0.
    expect(activeSubBoardAfter(5, Array(9).fill(null))).toBe(5)
  })

  it('frees the opponent when the target sub-board is decided', () => {
    const results = Array(9).fill(null)
    results[5] = 'O'
    expect(activeSubBoardAfter(5, results)).toBeNull()
  })
})

describe('legalUltimateMoves', () => {
  it('lists every cell when any sub-board is allowed', () => {
    expect(legalUltimateMoves(createEmptyUltimateBoard(), null)).toHaveLength(81)
  })

  it('only lists empty cells of the active sub-board', () => {
    const board = createEmptyUltimateBoard()
    board[27] = 'X'
    expect(legalUltimateMoves(board, 3)).toEqual([28, 29, 30, 31, 32, 33, 34, 35])
  })

  it('skips decided sub-boards when playing anywhere', () => {
    const board = createEmptyUltimateBoard()
    fillSubBoard(board, 0, X_WINS_ROW)
    const moves = legalUltimateMoves(board, null)
    expect(moves.some((position) => position < 9)).toBe(false)
    expect(moves).toHaveLength(72)
  })
})

describe('assertUltimateMoveAllowed', () => {
  it('rejects a move outside the active sub-board', () => {
    expect(() => assertUltimateMoveAllowed(createEmptyUltimateBoard(), 0, 4)).toThrow(InvalidMoveError)
  })

  it('rejects a move in a decided sub-board', () => {
    const board = createEmptyUltimateBoard()
    fillSubBoard(board, 0, X_WINS_ROW)
    expect(() => assertUltimateMoveAllowed(board, 5, null)).toThrow('Sub-board already decided')
  })

  it('accepts a move in the active sub-board', () => {
    expect(() => assertUltimateMoveAllowed(createEmptyUltimateBoard(), 40, 4)).not.toThrow()
  })
})
