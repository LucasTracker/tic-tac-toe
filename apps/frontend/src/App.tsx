import { useEffect, useState } from 'react'
import type { BoardSize, BotDifficulty, GameState, ScoreBoard } from '@tic-tac-toe/shared'
import { Board } from './components/Board'
import { createGame, getScore, makeMove } from './api/client'

type Theme = 'light' | 'dark'
type GameMode = 'local' | 'bot'
type SeriesFormat = 1 | 3 | 5

const seriesFormatInfo: Record<SeriesFormat, { label: string; target: number }> = {
  1: { label: 'Partida única', target: 1 },
  3: { label: 'Melhor de 3', target: 2 },
  5: { label: 'Melhor de 5', target: 3 },
}

const difficultyInfo: Record<BotDifficulty, { label: string; description: string }> = {
  easy: {
    label: 'Fácil',
    description: 'O bot escolhe uma jogada livre aleatoriamente.',
  },
  medium: {
    label: 'Médio',
    description: 'O bot combina jogadas estratégicas com escolhas aleatórias.',
  },
  unbeatable: {
    label: 'Imbatível',
    description: 'O bot analisa as possibilidades e não perde no tabuleiro 3x3.',
  },
}

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
  const [seriesFormat, setSeriesFormat] = useState<SeriesFormat>(1)
  const [seriesScore, setSeriesScore] = useState({ X: 0, O: 0 })
  const [seriesWinner, setSeriesWinner] = useState<'X' | 'O' | null>(null)
  const [round, setRound] = useState(1)
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
    if (!game || game.status !== 'in_progress' || seriesWinner) return
    try {
      const updated = await makeMove(game.id, { position, player: game.currentPlayer })
      setGame(updated)
      if (updated.status !== 'in_progress') {
        await refreshScore()
        if (updated.winner) {
          const nextScore = {
            ...seriesScore,
            [updated.winner]: seriesScore[updated.winner] + 1,
          }
          setSeriesScore(nextScore)
          if (nextScore[updated.winner] >= seriesFormatInfo[seriesFormat].target) {
            setSeriesWinner(updated.winner)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed')
    }
  }

  function resetSeries(nextFormat: SeriesFormat = seriesFormat) {
    setSeriesFormat(nextFormat)
    setSeriesScore({ X: 0, O: 0 })
    setSeriesWinner(null)
    setRound(1)
    void startNewGame(mode, size, difficulty)
  }

  function startNextRound() {
    setRound((currentRound) => currentRound + 1)
    void startNewGame()
  }

  function handleModeChange(nextMode: GameMode) {
    setMode(nextMode)
    setSeriesScore({ X: 0, O: 0 })
    setSeriesWinner(null)
    setRound(1)
    void startNewGame(nextMode, size, difficulty)
  }

  function handleSizeChange(nextSize: BoardSize) {
    setSize(nextSize)
    setSeriesScore({ X: 0, O: 0 })
    setSeriesWinner(null)
    setRound(1)
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
        Series format:
        <select value={seriesFormat} onChange={(e) => resetSeries(Number(e.target.value) as SeriesFormat)}>
          {Object.entries(seriesFormatInfo).map(([value, info]) => (
            <option key={value} value={value}>
              {info.label}
            </option>
          ))}
        </select>
      </label>

      <p className="series-score" aria-live="polite">
        Série · Rodada {round} · X {seriesScore.X} × {seriesScore.O} O
      </p>

      <label>
        Board size:
        <select value={size} onChange={(e) => handleSizeChange(Number(e.target.value) as BoardSize)}>
          <option value={3}>3x3</option>
          <option value={4}>4x4</option>
          <option value={5}>5x5</option>
        </select>
      </label>

      {mode === 'bot' && (
        <div className="bot-settings">
          <label htmlFor="difficulty">Difficulty:</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => {
              const nextDifficulty = e.target.value as BotDifficulty
              setDifficulty(nextDifficulty)
              setSeriesScore({ X: 0, O: 0 })
              setSeriesWinner(null)
              setRound(1)
              void startNewGame('bot', size, nextDifficulty)
            }}
          >
            {Object.entries(difficultyInfo).map(([value, info]) => (
              <option key={value} value={value}>
                {info.label}
              </option>
            ))}
          </select>
          <p className="setting-description">{difficultyInfo[difficulty].description}</p>
        </div>
      )}

      <Board board={game.board} onCellClick={handleCellClick} winningLine={game.winningLine} />
      {game.status === 'in_progress' && (
        <p>
          Turn: {game.currentPlayer}
          {mode === 'bot' && ` · Bot: ${difficultyInfo[difficulty].label}`}
        </p>
      )}
      {game.status === 'won' && <p>Winner: {game.winner}</p>}
      {game.status === 'draw' && <p>Draw!</p>}
      {seriesWinner ? (
        <>
          <p className="series-winner" aria-live="polite">
            {seriesWinner} venceu a série!
          </p>
          <button onClick={() => resetSeries()}>Nova série</button>
        </>
      ) : game.status !== 'in_progress' ? (
        <button onClick={startNextRound}>Próxima rodada</button>
      ) : (
        <button onClick={() => void startNewGame()}>Reiniciar rodada</button>
      )}
    </main>
  )
}
