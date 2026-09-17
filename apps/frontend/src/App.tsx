import { useEffect, useState } from 'react'
import type { BotDifficulty, GameState, ScoreBoard } from '@tic-tac-toe/shared'
import { Board } from './components/Board'
import { createGame, getScore, makeMove } from './api/client'

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [score, setScore] = useState<ScoreBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vsBot, setVsBot] = useState(false)
  const [difficulty, setDifficulty] = useState<BotDifficulty>('unbeatable')

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
      const created = await createGame(vsBot ? { vsBot: true, botDifficulty: difficulty } : {})
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
      <label>
        <input type="checkbox" checked={vsBot} onChange={(e) => setVsBot(e.target.checked)} />
        Play against bot
      </label>
      {vsBot && (
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as BotDifficulty)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="unbeatable">Unbeatable</option>
        </select>
      )}
      <Board board={game.board} onCellClick={handleCellClick} winningLine={game.winningLine} />
      {game.status === 'in_progress' && <p>Turn: {game.currentPlayer}</p>}
      {game.status === 'won' && <p>Winner: {game.winner}</p>}
      {game.status === 'draw' && <p>Draw!</p>}
      <button onClick={handleNewGame}>New Game</button>
    </main>
  )
}
