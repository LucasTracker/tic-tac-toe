import type { FastifyInstance } from 'fastify'
import type { CreateGameOptions, Move } from '@tic-tac-toe/shared'
import { createGame, getGame, getScore, recordResult, saveGame } from '../game/state'
import { applyMove, evaluateBoard, InvalidMoveError, nextPlayer } from '../game/logic'
import { chooseBotMove } from '../game/bot'

export async function gamesRoutes(app: FastifyInstance) {
  app.post<{ Body?: CreateGameOptions }>(
    '/games',
    {
      schema: {
        body: {
          type: ['object', 'null'],
          properties: {
            size: { type: 'integer', enum: [3, 4, 5] },
            vsBot: { type: 'boolean' },
            botDifficulty: { type: 'string', enum: ['easy', 'medium', 'unbeatable'] },
          },
        },
      },
    },
    async (req, reply) => {
      const game = createGame(req.body ?? {})
      return reply.code(201).send(game)
    }
  )

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
            position: { type: 'integer', minimum: 0, maximum: 24 },
            player: { type: 'string', enum: ['X', 'O'] },
          },
        },
      },
    },
    async (req, reply) => {
      const game = getGame(req.params.id)
      if (!game) return reply.code(404).send({ error: 'Game not found' })

      try {
        let board = applyMove(
          game.board,
          req.body.position,
          req.body.player,
          game.currentPlayer,
          game.status
        )
        let result = evaluateBoard(board)
        let currentPlayer = nextPlayer(game.currentPlayer)

        if (game.vsBot && result.status === 'in_progress' && currentPlayer !== req.body.player) {
          const botPosition = chooseBotMove(board, currentPlayer, game.botDifficulty ?? 'unbeatable')
          board = applyMove(board, botPosition, currentPlayer, currentPlayer, result.status)
          result = evaluateBoard(board)
          currentPlayer = nextPlayer(currentPlayer)
        }

        const updated = {
          ...game,
          board,
          status: result.status,
          winner: result.winner,
          winningLine: result.winningLine,
          currentPlayer,
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
