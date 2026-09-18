import { describe, expect, it } from 'vitest'
import {
  applyMove,
  buildWinningLines,
  CannotUndoError,
  createEmptyBoard,
  evaluateBoard,
  InvalidMoveError,
  nextPlayer,
  undoLastTurn,
} from './logic'
import type { Board, BoardSize } from '@tic-tac-toe/shared'

describe('createEmptyBoard', () => {
  it('returns 9 empty cells by default', () => {
    expect(createEmptyBoard()).toEqual(Array(9).fill(null))
  })

  it.each([3, 4, 5] as BoardSize[])('returns size*size empty cells for a %ix%i board', (size) => {
    expect(createEmptyBoard(size)).toEqual(Array(size * size).fill(null))
  })
})

describe('evaluateBoard', () => {
  it.each(buildWinningLines(3))('detects a win for X on line [%i, %i, %i]', (a, b, c) => {
    const board: Board = createEmptyBoard()
    board[a] = 'X'
    board[b] = 'X'
    board[c] = 'X'
    expect(evaluateBoard(board)).toEqual({ status: 'won', winner: 'X', winningLine: [a, b, c] })
  })

  it.each([4, 5] as BoardSize[])('detects a full-line win on a %ix%i board', (size) => {
    for (const line of buildWinningLines(size)) {
      const board: Board = createEmptyBoard(size)
      for (const index of line) board[index] = 'O'
      expect(evaluateBoard(board)).toEqual({ status: 'won', winner: 'O', winningLine: line })
    }
  })

  it('detects a draw when the board is full with no winner', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    expect(evaluateBoard(board)).toEqual({ status: 'draw', winner: null, winningLine: null })
  })

  it('reports in_progress when the board is incomplete with no winner', () => {
    const board: Board = createEmptyBoard()
    board[0] = 'X'
    expect(evaluateBoard(board)).toEqual({ status: 'in_progress', winner: null, winningLine: null })
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

  it('rejects an out-of-bounds position on a larger board', () => {
    const board = createEmptyBoard(5)
    expect(() => applyMove(board, 25, 'X', 'X', 'in_progress')).toThrow(InvalidMoveError)
  })
})

describe('undoLastTurn', () => {
  it('throws when there are no moves', () => {
    expect(() => undoLastTurn(createEmptyBoard(), [], false)).toThrow(CannotUndoError)
  })

  it('removes the last local move and restores that player turn', () => {
    const board = createEmptyBoard()
    board[0] = 'X'
    board[4] = 'O'
    const result = undoLastTurn(
      board,
      [
        { position: 0, player: 'X' },
        { position: 4, player: 'O' },
      ],
      false
    )

    expect(result.board[4]).toBeNull()
    expect(result.board[0]).toBe('X')
    expect(result.currentPlayer).toBe('O')
    expect(result.moveHistory).toEqual([{ position: 0, player: 'X' }])
  })

  it('removes the human move and the bot reply together', () => {
    const board = createEmptyBoard()
    board[0] = 'X'
    board[4] = 'O'
    const result = undoLastTurn(
      board,
      [
        { position: 0, player: 'X' },
        { position: 4, player: 'O' },
      ],
      true
    )

    expect(result.board).toEqual(createEmptyBoard())
    expect(result.currentPlayer).toBe('X')
    expect(result.moveHistory).toEqual([])
  })

  it('removes only the human move when the bot did not reply', () => {
    const board = createEmptyBoard()
    board[0] = 'X'
    board[1] = 'X'
    board[2] = 'X'
    const result = undoLastTurn(
      board,
      [
        { position: 0, player: 'X' },
        { position: 1, player: 'X' },
        { position: 2, player: 'X' },
      ],
      true
    )

    expect(result.board[2]).toBeNull()
    expect(result.board[0]).toBe('X')
    expect(result.currentPlayer).toBe('X')
  })
})
