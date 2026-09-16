import type { GameState, Player } from '@tic-tac-toe/shared'

const BASE_URL = 'http://localhost:3000'

export async function createGame(): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games`, { method: 'POST' })
  return res.json()
}

export async function getGame(id: string): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${id}`)
  return res.json()
}

export async function makeMove(id: string, position: number, player: Player): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${id}/moves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position, player }),
  })
  if (!res.ok) {
    const body = await res.json()
    throw new Error(body.error ?? 'Move failed')
  }
  return res.json()
}
