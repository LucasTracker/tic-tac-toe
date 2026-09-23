import type { FastifyInstance } from 'fastify'
import type { Board, CreateGameOptions, GameState, Move, Player } from '@tic-tac-toe/shared'
import { createGame, getGame, getHistory, getScore, recordResult, saveGame, unrecordResult } from '../game/state'
import { applyMove, CannotUndoError, evaluateBoard, InvalidMoveError, nextPlayer, undoLastTurn } from '../game/logic'
import { chooseBotMove, chooseUltimateBotMove } from '../game/bot'
import {
  activeSubBoardFor,
  assertUltimateMoveAllowed,
  evaluateSubBoards,
  evaluateUltimateBoard,
  ULTIMATE_BOARD_CELLS,
} from '../game/ultimate'

type BoardEvaluation = Pick<GameState, 'status' | 'winner' | 'winningLine' | 'subBoardResults' | 'activeSubBoard'>

function evaluateGameBoard(game: GameState, board: Board, moveHistory: Move[]): BoardEvaluation {
  if (game.variant !== 'ultimate') {
    return { ...evaluateBoard(board), subBoardResults: null, activeSubBoard: null }
  }
  const subBoardResults = evaluateSubBoards(board)
  return {
    ...evaluateUltimateBoard(board, subBoardResults),
    subBoardResults,
    activeSubBoard: activeSubBoardFor(moveHistory, subBoardResults),
  }
}

function playMove(
  game: GameState,
  board: Board,
  evaluation: BoardEvaluation,
  move: Move,
  currentPlayer: Player
): Board {
  const next = applyMove(board, move.position, move.player, currentPlayer, evaluation.status)
  if (game.variant === 'ultimate') assertUltimateMoveAllowed(board, move.position, evaluation.activeSubBoard)
  return next
}

function timeLimitExceeded(game: ReturnType<typeof getGame>): boolean {
  return Boolean(
    game &&
      game.status === 'in_progress' &&
      game.timeLimitSeconds > 0 &&
      Date.now() >= game.turnStartedAt + game.timeLimitSeconds * 1_000
  )
}

function finishForTimeout(game: NonNullable<ReturnType<typeof getGame>>) {
  const updated = {
    ...game,
    status: 'timeout' as const,
    winner: nextPlayer(game.currentPlayer),
    timedOutPlayer: game.currentPlayer,
    winningLine: null,
  }
  saveGame(updated)
  recordResult(updated)
  return updated
}

export async function gamesRoutes(app: FastifyInstance) {
  app.post<{ Body?: CreateGameOptions }>(
    '/games',
    {
      schema: {
        body: {
          type: ['object', 'null'],
          properties: {
            size: { type: 'integer', enum: [3, 4, 5] },
            variant: { type: 'string', enum: ['classic', 'ultimate'] },
            vsBot: { type: 'boolean' },
            botDifficulty: { type: 'string', enum: ['easy', 'medium', 'unbeatable'] },
            timeLimitSeconds: { type: 'integer', enum: [0, 10, 30, 60] },
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
            position: { type: 'integer', minimum: 0, maximum: ULTIMATE_BOARD_CELLS - 1 },
            player: { type: 'string', enum: ['X', 'O'] },
          },
        },
      },
    },
    async (req, reply) => {
      const game = getGame(req.params.id)
      if (!game) return reply.code(404).send({ error: 'Game not found' })
      if (timeLimitExceeded(game)) return finishForTimeout(game)

      try {
        const move = { position: req.body.position, player: req.body.player }
        let board = playMove(game, game.board, game, move, game.currentPlayer)
        let moveHistory = [...game.moveHistory, move]
        let evaluation = evaluateGameBoard(game, board, moveHistory)
        let currentPlayer = nextPlayer(game.currentPlayer)

        if (game.vsBot && evaluation.status === 'in_progress' && currentPlayer !== req.body.player) {
          const difficulty = game.botDifficulty ?? 'unbeatable'
          const botPosition =
            game.variant === 'ultimate'
              ? chooseUltimateBotMove(board, evaluation.activeSubBoard, currentPlayer, difficulty)
              : chooseBotMove(board, currentPlayer, difficulty)
          const botMove = { position: botPosition, player: currentPlayer }
          board = playMove(game, board, evaluation, botMove, currentPlayer)
          moveHistory = [...moveHistory, botMove]
          evaluation = evaluateGameBoard(game, board, moveHistory)
          currentPlayer = nextPlayer(currentPlayer)
        }

        const updated = {
          ...game,
          board,
          moveHistory,
          ...evaluation,
          currentPlayer,
          turnStartedAt: Date.now(),
        }
        saveGame(updated)
        if (game.status === 'in_progress' && evaluation.status !== 'in_progress') {
          recordResult(updated)
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

  app.post<{ Params: { id: string } }>('/games/:id/timeout', async (req, reply) => {
    const game = getGame(req.params.id)
    if (!game) return reply.code(404).send({ error: 'Game not found' })
    if (!timeLimitExceeded(game)) return game
    return finishForTimeout(game)
  })

  app.post<{ Params: { id: string } }>('/games/:id/undo', async (req, reply) => {
    const game = getGame(req.params.id)
    if (!game) return reply.code(404).send({ error: 'Game not found' })
    if (game.status === 'timeout') {
      return reply.code(409).send({ error: 'Cannot undo a timed-out game' })
    }

    try {
      const undone = undoLastTurn(game.board, game.moveHistory, game.vsBot)
      const updated = {
        ...game,
        ...undone,
        ...evaluateGameBoard(game, undone.board, undone.moveHistory),
        timedOutPlayer: null,
        turnStartedAt: Date.now(),
      }
      saveGame(updated)
      if (game.status !== 'in_progress') unrecordResult(game.id)
      return updated
    } catch (err) {
      if (err instanceof CannotUndoError) {
        return reply.code(409).send({ error: err.message })
      }
      throw err
    }
  })

  app.get('/score', async () => getScore())
  app.get('/history', async () => getHistory())
}
