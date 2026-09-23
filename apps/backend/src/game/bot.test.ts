import { describe, expect, it } from 'vitest'
import type { Board, Player } from '@tic-tac-toe/shared'
import { chooseBotMove, chooseUltimateBotMove } from './bot'
import { applyMove, createEmptyBoard, evaluateBoard, nextPlayer } from './logic'
import {
  activeSubBoardAfter,
  createEmptyUltimateBoard,
  evaluateSubBoards,
  evaluateUltimateBoard,
  legalUltimateMoves,
} from './ultimate'

function playRandomVsBot(botPlayer: Player) {
  let board: Board = createEmptyBoard()
  let currentPlayer: Player = 'X'
  let status = evaluateBoard(board).status

  while (status === 'in_progress') {
    const empties = board.reduce<number[]>((acc, cell, i) => {
      if (cell === null) acc.push(i)
      return acc
    }, [])

    const position =
      currentPlayer === botPlayer
        ? chooseBotMove(board, botPlayer, 'unbeatable')
        : empties[Math.floor(Math.random() * empties.length)]

    board = applyMove(board, position, currentPlayer, currentPlayer, status)
    const result = evaluateBoard(board)
    status = result.status
    currentPlayer = nextPlayer(currentPlayer)

    if (status !== 'in_progress') return result
  }
  return evaluateBoard(board)
}

describe('chooseBotMove', () => {
  it('an unbeatable bot never loses against random play', () => {
    for (let i = 0; i < 50; i++) {
      const result = playRandomVsBot('O')
      expect(result.winner).not.toBe('X')
    }
  })

  it('returns a position on an empty cell', () => {
    const board = createEmptyBoard()
    const position = chooseBotMove(board, 'O', 'easy')
    expect(board[position]).toBeNull()
  })

  it('returns a valid position on a 4x4 board', () => {
    const board = createEmptyBoard(4)
    const position = chooseBotMove(board, 'O', 'unbeatable')
    expect(board[position]).toBeNull()
  })
})

describe('chooseUltimateBotMove', () => {
  it('plays inside the active sub-board', () => {
    const board = createEmptyUltimateBoard()
    board[40] = 'X'
    const position = chooseUltimateBotMove(board, 4, 'O', 'unbeatable')
    expect(legalUltimateMoves(board, 4)).toContain(position)
  })

  it('completes a sub-board line that wins the game', () => {
    const board = createEmptyUltimateBoard()
    // O owns sub-boards 0 and 1 and needs one cell for sub-board 2.
    for (const subBoard of [0, 1]) {
      board[subBoard * 9] = 'O'
      board[subBoard * 9 + 1] = 'O'
      board[subBoard * 9 + 2] = 'O'
    }
    board[18] = 'O'
    board[19] = 'O'
    const position = chooseUltimateBotMove(board, 2, 'O', 'unbeatable')
    expect(position).toBe(20)
  })

  it('finishes whole games with only legal moves', () => {
    let board: Board = createEmptyUltimateBoard()
    let currentPlayer: Player = 'X'
    let lastPosition: number | undefined

    while (evaluateUltimateBoard(board).status === 'in_progress') {
      const active = activeSubBoardAfter(lastPosition, evaluateSubBoards(board))
      const moves = legalUltimateMoves(board, active)
      const position =
        currentPlayer === 'O'
          ? chooseUltimateBotMove(board, active, 'O', 'unbeatable')
          : moves[Math.floor(Math.random() * moves.length)]
      expect(moves).toContain(position)
      board = [...board]
      board[position] = currentPlayer
      lastPosition = position
      currentPlayer = nextPlayer(currentPlayer)
    }

    expect(evaluateUltimateBoard(board).winner).not.toBe('X')
  }, 20_000)
})
