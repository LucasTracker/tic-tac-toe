import type { Board, BotDifficulty, Player, SubBoardResult } from '@tic-tac-toe/shared'
import { boardSize, buildWinningLines, evaluateBoard, nextPlayer } from './logic'
import {
  activeSubBoardAfter,
  evaluateSubBoards,
  evaluateUltimateBoard,
  legalUltimateMoves,
  subBoardCells,
  SUB_BOARD_COUNT,
} from './ultimate'

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

const ULTIMATE_WIN_SCORE = 100_000
const ULTIMATE_CENTER_SUB_BOARD = 4
/** Search depth drops when the bot may play anywhere, since there are up to 81 moves. */
const ULTIMATE_DEPTH = { focused: 5, free: 4 }
/** Caps the search so a sequence of free moves cannot stall the request. */
const ULTIMATE_NODE_BUDGET = 150_000

function ultimateHeuristic(board: Board, results: SubBoardResult[], botPlayer: Player): number {
  const opponent = nextPlayer(botPlayer)
  let score = 0

  for (const line of buildWinningLines(3)) {
    const cells = line.map((index) => results[index])
    if (cells.includes('draw')) continue
    const botCount = cells.filter((cell) => cell === botPlayer).length
    const opponentCount = cells.filter((cell) => cell === opponent).length
    if (botCount > 0 && opponentCount > 0) continue
    score += 20 * (botCount ** 2 - opponentCount ** 2)
  }

  for (let subBoard = 0; subBoard < SUB_BOARD_COUNT; subBoard++) {
    const weight = subBoard === ULTIMATE_CENTER_SUB_BOARD ? 15 : 10
    if (results[subBoard] === botPlayer) score += weight
    else if (results[subBoard] === opponent) score -= weight
    else if (results[subBoard] === null) score += heuristicScore(subBoardCells(board, subBoard), botPlayer)
  }

  return score
}

interface UltimateSearch {
  botPlayer: Player
  maxDepth: number
  nodes: number
}

function ultimateMinimax(
  board: Board,
  lastPosition: number,
  currentPlayer: Player,
  search: UltimateSearch,
  depth: number,
  alpha: number,
  beta: number
): number {
  search.nodes += 1
  const results = evaluateSubBoards(board)
  const result = evaluateUltimateBoard(board, results)
  if (result.status !== 'in_progress') {
    if (result.winner === search.botPlayer) return ULTIMATE_WIN_SCORE - depth
    if (result.winner === null) return 0
    return depth - ULTIMATE_WIN_SCORE
  }
  if (depth >= search.maxDepth || search.nodes >= ULTIMATE_NODE_BUDGET) {
    return ultimateHeuristic(board, results, search.botPlayer)
  }

  const maximizing = currentPlayer === search.botPlayer
  let value = maximizing ? -Infinity : Infinity

  for (const position of legalUltimateMoves(board, activeSubBoardAfter(lastPosition, results), results)) {
    const next = [...board]
    next[position] = currentPlayer
    const score = ultimateMinimax(next, position, nextPlayer(currentPlayer), search, depth + 1, alpha, beta)

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

function bestUltimateMove(board: Board, activeSubBoard: number | null, botPlayer: Player): number {
  const moves = legalUltimateMoves(board, activeSubBoard)
  const search: UltimateSearch = {
    botPlayer,
    maxDepth: activeSubBoard === null ? ULTIMATE_DEPTH.free : ULTIMATE_DEPTH.focused,
    nodes: 0,
  }
  let bestScore = -Infinity
  let bestPosition = moves[0]

  for (const position of moves) {
    const next = [...board]
    next[position] = botPlayer
    const score = ultimateMinimax(next, position, nextPlayer(botPlayer), search, 1, bestScore, Infinity)
    if (score > bestScore) {
      bestScore = score
      bestPosition = position
    }
  }

  return bestPosition
}

export function chooseUltimateBotMove(
  board: Board,
  activeSubBoard: number | null,
  botPlayer: Player,
  difficulty: BotDifficulty
): number {
  const moves = legalUltimateMoves(board, activeSubBoard)
  const randomPosition = () => moves[Math.floor(Math.random() * moves.length)]
  if (difficulty === 'unbeatable') return bestUltimateMove(board, activeSubBoard, botPlayer)
  if (difficulty === 'medium') {
    return Math.random() < 0.5 ? bestUltimateMove(board, activeSubBoard, botPlayer) : randomPosition()
  }
  return randomPosition()
}
