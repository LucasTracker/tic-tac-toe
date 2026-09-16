import { useEffect, useState } from 'react'
import type { GameState } from '@tic-tac-toe/shared'
import { Board } from './components/Board'
import { createGame, makeMove } from './api/client'

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createGame()
      .then(setGame)
      .catch((err: Error) => setError(err.message))
  }, [])

  async function handleCellClick(position: number) {
    if (!game) return
    try {
      const updated = await makeMove(game.id, { position, player: game.currentPlayer })
      setGame(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed')
    }
  }

  if (error) return <p>Error: {error}</p>
  if (!game) return <p>Loading...</p>

  return (
    <main>
      <h1>Tic-Tac-Toe</h1>
      <Board board={game.board} onCellClick={handleCellClick} />
      {game.status === 'in_progress' && <p>Turn: {game.currentPlayer}</p>}
      {game.status === 'won' && <p>Winner: {game.winner}</p>}
      {game.status === 'draw' && <p>Draw!</p>}
    </main>
  )
}
