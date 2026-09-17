import { useEffect, useState } from 'react'
import type { GameState, ScoreBoard } from '@tic-tac-toe/shared'
import { Board } from './components/Board'
import { createGame, getScore, makeMove } from './api/client'

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [score, setScore] = useState<ScoreBoard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createGame()
      .then(setGame)
      .catch((err: Error) => setError(err.message))
    refreshScore()
  }, [])

  function refreshScore() {
    getScore()
      .then(setScore)
      .catch((err: Error) => setError(err.message))
  }

  async function handleCellClick(position: number) {
    if (!game) return
    try {
      const updated = await makeMove(game.id, { position, player: game.currentPlayer })
      setGame(updated)
      if (updated.status !== 'in_progress') refreshScore()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed')
    }
  }

  async function handleNewGame() {
    try {
      const created = await createGame()
      setGame(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
    }
  }

  if (error) return <p>Error: {error}</p>
  if (!game) return <p>Loading...</p>

  return (
    <main>
      <h1>Tic-Tac-Toe</h1>
      {score && (
        <p className="scoreboard">
          X wins: {score.xWins} | O wins: {score.oWins} | Draws: {score.draws}
        </p>
      )}
      <Board board={game.board} onCellClick={handleCellClick} winningLine={game.winningLine} />
      {game.status === 'in_progress' && <p>Turn: {game.currentPlayer}</p>}
      {game.status === 'won' && <p>Winner: {game.winner}</p>}
      {game.status === 'draw' && <p>Draw!</p>}
      {game.status !== 'in_progress' && <button onClick={handleNewGame}>New Game</button>}
    </main>
  )
}
