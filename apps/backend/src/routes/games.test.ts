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

describe('POST /games/:id/undo', () => {
  it('undoes the last local move', async () => {
    const app = buildServer()
    const createRes = await app.inject({ method: 'POST', url: '/games' })
    const { id } = createRes.json()

    await app.inject({ method: 'POST', url: `/games/${id}/moves`, payload: { position: 0, player: 'X' } })
    await app.inject({ method: 'POST', url: `/games/${id}/moves`, payload: { position: 4, player: 'O' } })

    const res = await app.inject({ method: 'POST', url: `/games/${id}/undo` })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ currentPlayer: 'O', status: 'in_progress' })
    expect(res.json().board[4]).toBeNull()
    expect(res.json().board[0]).toBe('X')
    expect(res.json().moveHistory).toEqual([{ position: 0, player: 'X' }])
  })

  it('undoes the human move and the bot reply together', async () => {
    const app = buildServer()
    const createRes = await app.inject({
      method: 'POST',
      url: '/games',
      payload: { vsBot: true, botDifficulty: 'easy' },
    })
    const { id } = createRes.json()

    const moved = await app.inject({
      method: 'POST',
      url: `/games/${id}/moves`,
      payload: { position: 0, player: 'X' },
    })
    expect(moved.json().board.filter(Boolean)).toHaveLength(2)

    const res = await app.inject({ method: 'POST', url: `/games/${id}/undo` })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ currentPlayer: 'X', status: 'in_progress' })
    expect(res.json().board.every((cell: string | null) => cell === null)).toBe(true)
    expect(res.json().moveHistory).toEqual([])
  })

  it('rejects undo when there are no moves', async () => {
    const app = buildServer()
    const createRes = await app.inject({ method: 'POST', url: '/games' })
    const { id } = createRes.json()

    const res = await app.inject({ method: 'POST', url: `/games/${id}/undo` })
    expect(res.statusCode).toBe(409)
  })

  it('rejects undo after a timeout', async () => {
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

    await app.inject({ method: 'POST', url: `/games/${id}/timeout` })
    const res = await app.inject({ method: 'POST', url: `/games/${id}/undo` })

    expect(res.statusCode).toBe(409)
  })

  it('restores a finished game and removes it from history', async () => {
    const app = buildServer()
    const createRes = await app.inject({ method: 'POST', url: '/games' })
    const { id } = createRes.json()

    await app.inject({ method: 'POST', url: `/games/${id}/moves`, payload: { position: 0, player: 'X' } })
    await app.inject({ method: 'POST', url: `/games/${id}/moves`, payload: { position: 3, player: 'O' } })
    await app.inject({ method: 'POST', url: `/games/${id}/moves`, payload: { position: 1, player: 'X' } })
    await app.inject({ method: 'POST', url: `/games/${id}/moves`, payload: { position: 4, player: 'O' } })
    const won = await app.inject({ method: 'POST', url: `/games/${id}/moves`, payload: { position: 2, player: 'X' } })
    expect(won.json().status).toBe('won')

    const res = await app.inject({ method: 'POST', url: `/games/${id}/undo` })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'in_progress', winner: null, currentPlayer: 'X' })
    expect(res.json().board[2]).toBeNull()

    const historyRes = await app.inject({ method: 'GET', url: '/history' })
    expect(historyRes.json()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id })]))
  })
})

describe('Ultimate variant', () => {
  async function createUltimateGame(payload: Record<string, unknown> = {}) {
    const app = buildServer()
    const createRes = await app.inject({ method: 'POST', url: '/games', payload: { variant: 'ultimate', ...payload } })
    return { app, game: createRes.json() }
  }

  it('creates an 81-cell game where any sub-board is playable', async () => {
    const { game } = await createUltimateGame()

    expect(game).toMatchObject({ variant: 'ultimate', size: 3, activeSubBoard: null })
    expect(game.board).toHaveLength(81)
    expect(game.subBoardResults).toEqual(Array(9).fill(null))
  })

  it('sends the next player to the sub-board matching the cell played', async () => {
    const { app, game } = await createUltimateGame()

    // Cell 7 of sub-board 4.
    const res = await app.inject({ method: 'POST', url: `/games/${game.id}/moves`, payload: { position: 43, player: 'X' } })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ currentPlayer: 'O', activeSubBoard: 7 })
  })

  it('rejects a move outside the active sub-board', async () => {
    const { app, game } = await createUltimateGame()
    await app.inject({ method: 'POST', url: `/games/${game.id}/moves`, payload: { position: 43, player: 'X' } })

    const res = await app.inject({ method: 'POST', url: `/games/${game.id}/moves`, payload: { position: 0, player: 'O' } })

    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('Must play in sub-board 7')
  })

  it('lets the bot answer inside the sub-board it was sent to', async () => {
    const { app, game } = await createUltimateGame({ vsBot: true, botDifficulty: 'unbeatable' })

    const res = await app.inject({ method: 'POST', url: `/games/${game.id}/moves`, payload: { position: 43, player: 'X' } })

    const [, botMove] = res.json().moveHistory
    expect(botMove.player).toBe('O')
    expect(Math.floor(botMove.position / 9)).toBe(7)
    expect(res.json().currentPlayer).toBe('X')
  })

  it('restores the active sub-board on undo', async () => {
    const { app, game } = await createUltimateGame()
    await app.inject({ method: 'POST', url: `/games/${game.id}/moves`, payload: { position: 43, player: 'X' } })
    await app.inject({ method: 'POST', url: `/games/${game.id}/moves`, payload: { position: 65, player: 'O' } })

    const res = await app.inject({ method: 'POST', url: `/games/${game.id}/undo` })

    expect(res.json()).toMatchObject({ currentPlayer: 'O', activeSubBoard: 7 })
  })
})
