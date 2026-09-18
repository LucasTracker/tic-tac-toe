import type { CreateGameOptions, GameHistoryEntry, GameState, Move, ScoreBoard } from '@tic-tac-toe/shared'

const BASE_URL = 'http://localhost:3000'

export async function createGame(options: CreateGameOptions = {}): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  })
  return res.json()
}

export async function getGame(id: string): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${id}`)
  return res.json()
}

async function postGameAction(path: string, fallbackError: string, body?: unknown): Promise<GameState> {
  const request: RequestInit = { method: 'POST' }
  if (body !== undefined) {
    request.headers = { 'Content-Type': 'application/json' }
    request.body = JSON.stringify(body)
  }

  const res = await fetch(`${BASE_URL}${path}`, request)
  if (!res.ok) {
    const payload = await res.json()
    throw new Error(payload.error ?? fallbackError)
  }
  return res.json()
}

export async function makeMove(id: string, move: Move): Promise<GameState> {
  return postGameAction(`/games/${id}/moves`, 'Move failed', move)
}

export async function expireTurn(id: string): Promise<GameState> {
  return postGameAction(`/games/${id}/timeout`, 'Could not expire turn')
}

export async function undoMove(id: string): Promise<GameState> {
  return postGameAction(`/games/${id}/undo`, 'Could not undo move')
}

export async function getScore(): Promise<ScoreBoard> {
  const res = await fetch(`${BASE_URL}/score`)
  return res.json()
}

export async function getHistory(): Promise<GameHistoryEntry[]> {
  const res = await fetch(`${BASE_URL}/history`)
  return res.json()
}
