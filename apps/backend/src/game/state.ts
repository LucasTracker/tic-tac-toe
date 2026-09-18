import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, renameSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { CreateGameOptions, GameHistoryEntry, GameState, ScoreBoard } from '@tic-tac-toe/shared'
import { createEmptyBoard } from './logic'

const games = new Map<string, GameState>()

const storagePath = process.env.TIC_TAC_TOE_DATA_FILE ?? resolve(process.cwd(), 'data', 'game-history.json')
const defaultScore: ScoreBoard = { xWins: 0, oWins: 0, draws: 0 }
let score: ScoreBoard = { ...defaultScore }
let history: GameHistoryEntry[] = []

function loadResults(): void {
  if (!existsSync(storagePath)) return
  try {
    const stored = JSON.parse(readFileSync(storagePath, 'utf8')) as {
      score?: ScoreBoard
      history?: GameHistoryEntry[]
    }
    if (stored.score) score = { ...defaultScore, ...stored.score }
    if (Array.isArray(stored.history)) history = stored.history
  } catch {
    // A corrupt history must not prevent the game server from starting.
    score = { ...defaultScore }
    history = []
  }
}

function persistResults(): void {
  mkdirSync(dirname(storagePath), { recursive: true })
  const temporaryPath = `${storagePath}.tmp`
  writeFileSync(temporaryPath, JSON.stringify({ score, history }, null, 2))
  renameSync(temporaryPath, storagePath)
}

loadResults()

export function createGame(options: CreateGameOptions = {}): GameState {
  const size = options.size ?? 3
  const game: GameState = {
    id: randomUUID(),
    board: createEmptyBoard(size),
    size,
    currentPlayer: 'X',
    status: 'in_progress',
    winner: null,
    winningLine: null,
    vsBot: options.vsBot ?? false,
    botDifficulty: options.vsBot ? options.botDifficulty ?? 'unbeatable' : null,
    timeLimitSeconds: options.timeLimitSeconds ?? 0,
    createdAt: Date.now(),
    turnStartedAt: Date.now(),
    timedOutPlayer: null,
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

export function getHistory(): GameHistoryEntry[] {
  return history.map((entry) => ({ ...entry, board: [...entry.board] }))
}

export function recordResult(game: GameState): void {
  if (game.status === 'won' || game.status === 'timeout') {
    if (game.winner === 'X') score.xWins += 1
    else if (game.winner === 'O') score.oWins += 1
  } else if (game.status === 'draw') {
    score.draws += 1
  }
  if (game.status === 'in_progress') return

  history = [
    {
      id: game.id,
      completedAt: Date.now(),
      durationSeconds: Math.max(0, Math.round((Date.now() - game.createdAt) / 1_000)),
      endReason: game.status,
      winner: game.winner,
      timedOutPlayer: game.timedOutPlayer,
      board: [...game.board],
      size: game.size,
      vsBot: game.vsBot,
      botDifficulty: game.botDifficulty,
      timeLimitSeconds: game.timeLimitSeconds,
    },
    ...history,
  ].slice(0, 50)
  persistResults()
}
