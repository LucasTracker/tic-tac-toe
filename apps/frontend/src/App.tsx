import { useEffect, useState } from 'react'
import type { BoardSize, BotDifficulty, GameState, ScoreBoard } from '@tic-tac-toe/shared'
import { Board } from './components/Board'
import { createGame, getScore, makeMove } from './api/client'

type Theme = 'light' | 'dark'
type GameMode = 'local' | 'bot'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [score, setScore] = useState<ScoreBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<GameMode>('local')
  const [difficulty, setDifficulty] = useState<BotDifficulty>('unbeatable')
  const [size, setSize] = useState<BoardSize>(3)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    void startNewGame('local', size, difficulty)
    void refreshScore()
  }, [])

  function refreshScore() {
    return getScore()
      .then(setScore)
      .catch((err: Error) => setError(err.message))
  }

  async function startNewGame(nextMode: GameMode = mode, nextSize: BoardSize = size, nextDifficulty: BotDifficulty = difficulty) {
    try {
      const created = await createGame(
        nextMode === 'bot' ? { size: nextSize, vsBot: true, botDifficulty: nextDifficulty } : { size: nextSize }
      )
      setGame(created)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
    }
  }

  async function handleCellClick(position: number) {
    if (!game) return
    try {
      const updated = await makeMove(game.id, { position, player: game.currentPlayer })
      setGame(updated)
      if (updated.status !== 'in_progress') {
        await refreshScore()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed')
    }
  }

  function handleModeChange(nextMode: GameMode) {
    setMode(nextMode)
    void startNewGame(nextMode, size, difficulty)
  }

  function handleSizeChange(nextSize: BoardSize) {
    setSize(nextSize)
    void startNewGame(mode, nextSize, difficulty)
  }

  if (error) return <p>Error: {error}</p>
  if (!game) return <p>Loading...</p>

  return (
    <main>
      <button
        className="theme-toggle"
        onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      <h1>Tic-Tac-Toe</h1>
      {score && (
        <p className="scoreboard">
          X wins: {score.xWins} | O wins: {score.oWins} | Draws: {score.draws}
        </p>
      )}

      <div className="mode-selector" aria-label="Game mode selector">
        <button type="button" className={mode === 'local' ? 'selected' : ''} onClick={() => handleModeChange('local')}>
          Local multiplayer
        </button>
        <button type="button" className={mode === 'bot' ? 'selected' : ''} onClick={() => handleModeChange('bot')}>
          vs Bot
        </button>
      </div>

      <label>
        Board size:
        <select value={size} onChange={(e) => handleSizeChange(Number(e.target.value) as BoardSize)}>
          <option value={3}>3x3</option>
          <option value={4}>4x4</option>
          <option value={5}>5x5</option>
        </select>
      </label>

      {mode === 'bot' && (
        <label>
          Difficulty:
          <select value={difficulty} onChange={(e) => {
            const nextDifficulty = e.target.value as BotDifficulty
            setDifficulty(nextDifficulty)
            void startNewGame('bot', size, nextDifficulty)
          }}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="unbeatable">Unbeatable</option>
          </select>
        </label>
      )}

      <Board board={game.board} onCellClick={handleCellClick} winningLine={game.winningLine} />
      {game.status === 'in_progress' && <p>Turn: {game.currentPlayer}</p>}
      {game.status === 'won' && <p>Winner: {game.winner}</p>}
      {game.status === 'draw' && <p>Draw!</p>}
      <button onClick={() => void startNewGame()}>New Game</button>
    </main>
  )
}
