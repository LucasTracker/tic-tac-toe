import type { Board, BotDifficulty, Player } from '@tic-tac-toe/shared'
import { evaluateBoard, nextPlayer } from './logic'

function emptyPositions(board: Board): number[] {
  return board.reduce<number[]>((positions, cell, index) => {
    if (cell === null) positions.push(index)
    return positions
  }, [])
}

function minimax(board: Board, currentPlayer: Player, botPlayer: Player, depth: number): number {
  const result = evaluateBoard(board)
  if (result.status !== 'in_progress') {
    if (result.winner === botPlayer) return 10 - depth
    if (result.winner === null) return 0
    return depth - 10
  }

  const scores = emptyPositions(board).map((position) => {
    const next = [...board]
    next[position] = currentPlayer
    return minimax(next, nextPlayer(currentPlayer), botPlayer, depth + 1)
  })

  return currentPlayer === botPlayer ? Math.max(...scores) : Math.min(...scores)
}

function bestMove(board: Board, botPlayer: Player): number {
  let bestScore = -Infinity
  let bestPosition = emptyPositions(board)[0]

  for (const position of emptyPositions(board)) {
    const next = [...board]
    next[position] = botPlayer
    const score = minimax(next, nextPlayer(botPlayer), botPlayer, 1)
    if (score > bestScore) {
      bestScore = score
      bestPosition = position
    }
  }

  return bestPosition
}

function randomMove(board: Board): number {
  const positions = emptyPositions(board)
  return positions[Math.floor(Math.random() * positions.length)]
}

export function chooseBotMove(board: Board, botPlayer: Player, difficulty: BotDifficulty): number {
  if (difficulty === 'unbeatable') return bestMove(board, botPlayer)
  if (difficulty === 'medium') return Math.random() < 0.5 ? bestMove(board, botPlayer) : randomMove(board)
  return randomMove(board)
}
