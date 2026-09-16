import { describe, expect, it } from 'vitest'
import { buildServer } from '../server'

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
})
