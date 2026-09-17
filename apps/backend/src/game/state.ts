import { randomUUID } from 'node:crypto'
import type { CreateGameOptions, GameState, ScoreBoard } from '@tic-tac-toe/shared'
import { createEmptyBoard } from './logic'

const games = new Map<string, GameState>()

const score: ScoreBoard = { xWins: 0, oWins: 0, draws: 0 }

export function createGame(options: CreateGameOptions = {}): GameState {
  const game: GameState = {
    id: randomUUID(),
    board: createEmptyBoard(),
    currentPlayer: 'X',
    status: 'in_progress',
    winner: null,
    winningLine: null,
    vsBot: options.vsBot ?? false,
    botDifficulty: options.vsBot ? options.botDifficulty ?? 'unbeatable' : null,
  }
  games.set(game.id, game)
  return game
}

export function getGame(id: string): GameState | undefined {
  return games.get(id)
}

export function saveGame(game: GameState): void {
  games.set(game.id, game)
}

export function getScore(): ScoreBoard {
  return { ...score }
}

export function recordResult(status: GameState['status'], winner: GameState['winner']): void {
  if (status === 'won') {
    if (winner === 'X') score.xWins += 1
    else if (winner === 'O') score.oWins += 1
  } else if (status === 'draw') {
    score.draws += 1
  }
}
