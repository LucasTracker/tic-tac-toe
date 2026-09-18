import { describe, expect, it } from 'vitest'
import { buildServer } from '../server'
import { getGame } from '../game/state'

describe('POST /games/:id/moves validation', () => {
  it('rejects a missing body with 400', async () => {
    const app = buildServer()
    const createRes = await app.inject({ method: 'POST', url: '/games' })
    const { id } = createRes.json()

    const res = await app.inject({ method: 'POST', url: `/games/${id}/moves` })
    expect(res.statusCode).toBe(400)
  })

  it('rejects a non-integer position with 400', async () => {
    const app = buildServer()
    const createRes = await app.inject({ method: 'POST', url: '/games' })
    const { id } = createRes.json()

    const res = await app.inject({
      method: 'POST',
      url: `/games/${id}/moves`,
      payload: { position: '0', player: 'X' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('accepts a valid move with 200', async () => {
    const app = buildServer()
    const createRes = await app.inject({ method: 'POST', url: '/games' })
    const { id } = createRes.json()

    const res = await app.inject({
      method: 'POST',
      url: `/games/${id}/moves`,
      payload: { position: 0, player: 'X' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().board[0]).toBe('X')
  })

  it('ends the game and awards the other player when the turn expires', async () => {
    const app = buildServer()
    const createRes = await app.inject({
      method: 'POST',
      url: '/games',
      payload: { timeLimitSeconds: 10 },
    })
    const { id } = createRes.json()
    const game = getGame(id)
    if (!game) throw new Error('Game was not created')
    game.turnStartedAt = Date.now() - 10_000

    const res = await app.inject({ method: 'POST', url: `/games/${id}/timeout` })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'timeout', timedOutPlayer: 'X', winner: 'O' })

    const historyRes = await app.inject({ method: 'GET', url: '/history' })
    expect(historyRes.statusCode).toBe(200)
    expect(historyRes.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id, endReason: 'timeout', timedOutPlayer: 'X', winner: 'O', size: 3 }),
      ])
    )
  })

  it('does not accept a move after its turn has expired', async () => {
    const app = buildServer()
    const createRes = await app.inject({
      method: 'POST',
      url: '/games',
      payload: { timeLimitSeconds: 10 },
    })
    const { id } = createRes.json()
    const game = getGame(id)
    if (!game) throw new Error('Game was not created')
    game.turnStartedAt = Date.now() - 10_000

    const res = await app.inject({
      method: 'POST',
      url: `/games/${id}/moves`,
      payload: { position: 0, player: 'X' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'timeout', timedOutPlayer: 'X', winner: 'O' })
    expect(res.json().board[0]).toBeNull()
  })
})
