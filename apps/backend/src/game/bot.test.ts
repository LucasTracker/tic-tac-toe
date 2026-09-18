import { describe, expect, it } from 'vitest'
import type { Board, Player } from '@tic-tac-toe/shared'
import { chooseBotMove } from './bot'
import { applyMove, createEmptyBoard, evaluateBoard, nextPlayer } from './logic'

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
