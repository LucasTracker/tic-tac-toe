import { describe, expect, it } from 'vitest'
import { applyMove, createEmptyBoard, evaluateBoard, InvalidMoveError, nextPlayer } from './logic'
import type { Board } from '@tic-tac-toe/shared'

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

describe('createEmptyBoard', () => {
  it('returns 9 empty cells', () => {
    expect(createEmptyBoard()).toEqual(Array(9).fill(null))
  })
})

describe('evaluateBoard', () => {
  it.each(WINNING_LINES)('detects a win for X on line [%i, %i, %i]', (a, b, c) => {
    const board: Board = createEmptyBoard()
    board[a] = 'X'
    board[b] = 'X'
    board[c] = 'X'
    expect(evaluateBoard(board)).toEqual({ status: 'won', winner: 'X' })
  })

  it('detects a draw when the board is full with no winner', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    expect(evaluateBoard(board)).toEqual({ status: 'draw', winner: null })
  })

  it('reports in_progress when the board is incomplete with no winner', () => {
    const board: Board = createEmptyBoard()
    board[0] = 'X'
    expect(evaluateBoard(board)).toEqual({ status: 'in_progress', winner: null })
  })
})

describe('nextPlayer', () => {
  it('alternates X to O and O to X', () => {
    expect(nextPlayer('X')).toBe('O')
    expect(nextPlayer('O')).toBe('X')
  })
})

describe('applyMove', () => {
  it('places the player mark at the given position', () => {
    const board = createEmptyBoard()
    const result = applyMove(board, 4, 'X', 'X', 'in_progress')
    expect(result[4]).toBe('X')
  })

  it('rejects a move when it is not the given player turn', () => {
    const board = createEmptyBoard()
    expect(() => applyMove(board, 4, 'O', 'X', 'in_progress')).toThrow(InvalidMoveError)
  })

  it('rejects a move on an already occupied cell', () => {
    const board = createEmptyBoard()
    board[4] = 'X'
    expect(() => applyMove(board, 4, 'O', 'O', 'in_progress')).toThrow(InvalidMoveError)
  })

  it('rejects a move on a finished game', () => {
    const board = createEmptyBoard()
    expect(() => applyMove(board, 0, 'X', 'X', 'won')).toThrow(InvalidMoveError)
  })

  it('rejects an out-of-bounds position', () => {
    const board = createEmptyBoard()
    expect(() => applyMove(board, 9, 'X', 'X', 'in_progress')).toThrow(InvalidMoveError)
  })
})
