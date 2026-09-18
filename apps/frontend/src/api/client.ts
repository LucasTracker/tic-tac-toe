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

export async function makeMove(id: string, move: Move): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${id}/moves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(move),
  })
  if (!res.ok) {
    const body = await res.json()
    throw new Error(body.error ?? 'Move failed')
  }
  return res.json()
}

export async function expireTurn(id: string): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${id}/timeout`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json()
    throw new Error(body.error ?? 'Could not expire turn')
  }
  return res.json()
}

export async function getScore(): Promise<ScoreBoard> {
  const res = await fetch(`${BASE_URL}/score`)
  return res.json()
}

export async function getHistory(): Promise<GameHistoryEntry[]> {
  const res = await fetch(`${BASE_URL}/history`)
  return res.json()
}
