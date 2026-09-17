import type { FastifyInstance } from 'fastify'
import type { Move } from '@tic-tac-toe/shared'
import { createGame, getGame, getScore, recordResult, saveGame } from '../game/state'
import { applyMove, evaluateBoard, InvalidMoveError, nextPlayer } from '../game/logic'

export async function gamesRoutes(app: FastifyInstance) {
  app.post('/games', async (_req, reply) => {
    const game = createGame()
    return reply.code(201).send(game)
  })

  app.get<{ Params: { id: string } }>('/games/:id', async (req, reply) => {
    const game = getGame(req.params.id)
    if (!game) return reply.code(404).send({ error: 'Game not found' })
    return game
  })

  app.post<{ Params: { id: string }; Body: Move }>(
    '/games/:id/moves',
    {
      schema: {
        body: {
          type: 'object',
          required: ['position', 'player'],
          properties: {
            position: { type: 'integer', minimum: 0, maximum: 8 },
            player: { type: 'string', enum: ['X', 'O'] },
          },
        },
      },
    },
    async (req, reply) => {
      const game = getGame(req.params.id)
      if (!game) return reply.code(404).send({ error: 'Game not found' })

      try {
        const board = applyMove(
          game.board,
          req.body.position,
          req.body.player,
          game.currentPlayer,
          game.status
        )
        const result = evaluateBoard(board)
        const updated = {
          ...game,
          board,
          status: result.status,
          winner: result.winner,
          winningLine: result.winningLine,
          currentPlayer: nextPlayer(game.currentPlayer),
        }
        saveGame(updated)
        if (game.status === 'in_progress' && result.status !== 'in_progress') {
          recordResult(result.status, result.winner)
        }
        return updated
      } catch (err) {
        if (err instanceof InvalidMoveError) {
          return reply.code(409).send({ error: err.message })
        }
        throw err
      }
    }
  )

  app.get('/score', async () => getScore())
}
