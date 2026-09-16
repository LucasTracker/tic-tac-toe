import { randomUUID } from 'node:crypto'
import type { GameState } from '@tic-tac-toe/shared'
import { createEmptyBoard } from './logic'

const games = new Map<string, GameState>()

export function createGame(): GameState {
  const game: GameState = {
    id: randomUUID(),
    board: createEmptyBoard(),
    currentPlayer: 'X',
    status: 'in_progress',
    winner: null,
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
