import { useEffect, useState } from 'react'
import type { GameState } from '@tic-tac-toe/shared'
import { Board } from './components/Board'
import { createGame, makeMove } from './api/client'

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)

  useEffect(() => {
    createGame().then(setGame)
  }, [])

  async function handleCellClick(position: number) {
    if (!game) return
    const updated = await makeMove(game.id, position, game.currentPlayer)
    setGame(updated)
  }

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
