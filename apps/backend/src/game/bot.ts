import type { Board, BotDifficulty, Player } from '@tic-tac-toe/shared'
import { boardSize, buildWinningLines, evaluateBoard, nextPlayer } from './logic'

const MAX_DEPTH_BY_SIZE: Record<number, number> = { 3: Infinity, 4: 6, 5: 4 }

function emptyPositions(board: Board): number[] {
  return board.reduce<number[]>((positions, cell, index) => {
    if (cell === null) positions.push(index)
    return positions
  }, [])
}

function heuristicScore(board: Board, botPlayer: Player): number {
  const opponent = nextPlayer(botPlayer)
  let score = 0

  for (const line of buildWinningLines(boardSize(board))) {
    const cells = line.map((index) => board[index])
    const botCount = cells.filter((cell) => cell === botPlayer).length
    const opponentCount = cells.filter((cell) => cell === opponent).length

    if (botCount > 0 && opponentCount > 0) continue
    if (botCount > 0) score += botCount ** 2
    if (opponentCount > 0) score -= opponentCount ** 2
  }

  return score
}

function minimax(
  board: Board,
  currentPlayer: Player,
  botPlayer: Player,
  depth: number,
  maxDepth: number,
  alpha: number,
  beta: number
): number {
  const result = evaluateBoard(board)
  if (result.status !== 'in_progress') {
    if (result.winner === botPlayer) return 1000 - depth
    if (result.winner === null) return 0
    return depth - 1000
  }
  if (depth >= maxDepth) {
    return heuristicScore(board, botPlayer)
  }

  const maximizing = currentPlayer === botPlayer
  let value = maximizing ? -Infinity : Infinity

  for (const position of emptyPositions(board)) {
    const next = [...board]
    next[position] = currentPlayer
    const score = minimax(next, nextPlayer(currentPlayer), botPlayer, depth + 1, maxDepth, alpha, beta)

    if (maximizing) {
      value = Math.max(value, score)
      alpha = Math.max(alpha, value)
    } else {
      value = Math.min(value, score)
      beta = Math.min(beta, value)
    }
    if (beta <= alpha) break
  }

  return value
}

function bestMove(board: Board, botPlayer: Player): number {
  const maxDepth = MAX_DEPTH_BY_SIZE[boardSize(board)] ?? 4
  let bestScore = -Infinity
  let bestPosition = emptyPositions(board)[0]

  for (const position of emptyPositions(board)) {
    const next = [...board]
    next[position] = botPlayer
    const score = minimax(next, nextPlayer(botPlayer), botPlayer, 1, maxDepth, -Infinity, Infinity)
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
