# Tic-Tac-Toe Monorepo Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a pnpm-workspace monorepo with a Fastify+TypeScript backend and a React+Vite+TypeScript frontend for a local two-player tic-tac-toe game, sharing types via an internal package.

**Architecture:** pnpm workspace with `apps/backend`, `apps/frontend`, `packages/shared`. Backend holds game state in memory and exposes a REST API. Frontend is a single-page React app that drives the game through that API. Both apps import request/response types from `@tic-tac-toe/shared`.

**Tech Stack:** Node.js, TypeScript, Fastify, @fastify/cors, React 18, Vite, Vitest, React Testing Library, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-16-monorepo-scaffolding-design.md`

## Global Constraints

- Package manager: pnpm workspaces (no npm/yarn lockfiles).
- Backend dev/run via `tsx` (no separate compile step); `lint` script is `tsc --noEmit` for typechecking.
- Frontend build via `tsc -b && vite build`.
- State is in-memory only — no database, no persistence.
- No real-time/WebSocket, no auth, no CI config in this pass.
- Board is a flat 9-element array, positions 0-8, row-major (0,1,2 / 3,4,5 / 6,7,8).

---

### Task 1: Workspace root and tooling setup

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: workspace glob covering `apps/*` and `packages/*`; root scripts `dev`, `build`, `test`, `lint` that fan out via `pnpm --recursive` / `pnpm --parallel --filter`.

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "tic-tac-toe",
  "private": true,
  "packageManager": "pnpm@9.7.0",
  "scripts": {
    "dev": "pnpm --parallel --filter \"./apps/*\" dev",
    "build": "pnpm --recursive --filter \"./apps/*\" build",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint"
  }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules
dist
*.log
.DS_Store
```

- [ ] **Step 5: Install pnpm and verify workspace recognizes the layout**

Run: `pnpm --version`
Expected: prints a version (installs via corepack if missing: `corepack enable && corepack prepare pnpm@9.7.0 --activate`)

- [ ] **Step 6: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json .gitignore
git commit -m "chore: set up pnpm workspace root"
```

---

### Task 2: Shared types package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types.ts`

**Interfaces:**
- Produces: `@tic-tac-toe/shared` exporting `Player` (`'X' | 'O'`), `Cell` (`Player | null`), `Board` (`Cell[]`), `GameStatus` (`'in_progress' | 'won' | 'draw'`), `GameResult { status: GameStatus; winner: Player | null }`, `GameState { id: string; board: Board; currentPlayer: Player; status: GameStatus; winner: Player | null }`, `Move { position: number; player: Player }`.

- [ ] **Step 1: Create `packages/shared/package.json`**

```json
{
  "name": "@tic-tac-toe/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/types.ts",
  "types": "src/types.ts"
}
```

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/shared/src/types.ts`**

```ts
export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = Cell[]

export type GameStatus = 'in_progress' | 'won' | 'draw'

export interface GameResult {
  status: GameStatus
  winner: Player | null
}

export interface GameState {
  id: string
  board: Board
  currentPlayer: Player
  status: GameStatus
  winner: Player | null
}

export interface Move {
  position: number
  player: Player
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared game types package"
```

---

### Task 3: Backend game logic (pure functions, TDD)

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/src/game/logic.ts`
- Test: `apps/backend/src/game/logic.test.ts`

**Interfaces:**
- Consumes: `Board`, `Player`, `GameResult` from `@tic-tac-toe/shared` (Task 2).
- Produces: `createEmptyBoard(): Board`, `evaluateBoard(board: Board): GameResult`, `nextPlayer(player: Player): Player`, `applyMove(board: Board, position: number, player: Player, currentPlayer: Player, status: GameStatus): Board` (throws `InvalidMoveError`), and the `InvalidMoveError` class — all consumed by Task 4's routes.

- [ ] **Step 1: Create `apps/backend/package.json`**

```json
{
  "name": "@tic-tac-toe/backend",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts",
    "test": "vitest run",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@tic-tac-toe/shared": "workspace:*",
    "fastify": "^4.28.1"
  },
  "devDependencies": {
    "tsx": "^4.16.5",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `apps/backend/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Install dependencies from repo root**

Run: `pnpm install`
Expected: lockfile created/updated, no errors.

- [ ] **Step 4: Write the failing tests for `evaluateBoard`**

Create `apps/backend/src/game/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { applyMove, createEmptyBoard, evaluateBoard, InvalidMoveError, nextPlayer } from './logic'
import type { Board } from '@tic-tac-toe/shared'

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

describe('createEmptyBoard', () => {
  it('returns 9 empty cells', () => {
    expect(createEmptyBoard()).toEqual(Array(9).fill(null))
  })
})

describe('evaluateBoard', () => {
  it.each(WINNING_LINES)('detects a win for X on line [%i, %i, %i]', (a, b, c) => {
    const board: Board = createEmptyBoard()
    board[a] = 'X'
    board[b] = 'X'
    board[c] = 'X'
    expect(evaluateBoard(board)).toEqual({ status: 'won', winner: 'X' })
  })

  it('detects a draw when the board is full with no winner', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    expect(evaluateBoard(board)).toEqual({ status: 'draw', winner: null })
  })

  it('reports in_progress when the board is incomplete with no winner', () => {
    const board: Board = createEmptyBoard()
    board[0] = 'X'
    expect(evaluateBoard(board)).toEqual({ status: 'in_progress', winner: null })
  })
})

describe('nextPlayer', () => {
  it('alternates X to O and O to X', () => {
    expect(nextPlayer('X')).toBe('O')
    expect(nextPlayer('O')).toBe('X')
  })
})

describe('applyMove', () => {
  it('places the player mark at the given position', () => {
    const board = createEmptyBoard()
    const result = applyMove(board, 4, 'X', 'X', 'in_progress')
    expect(result[4]).toBe('X')
  })

  it('rejects a move when it is not the given player turn', () => {
    const board = createEmptyBoard()
    expect(() => applyMove(board, 4, 'O', 'X', 'in_progress')).toThrow(InvalidMoveError)
  })

  it('rejects a move on an already occupied cell', () => {
    const board = createEmptyBoard()
    board[4] = 'X'
    expect(() => applyMove(board, 4, 'O', 'O', 'in_progress')).toThrow(InvalidMoveError)
  })

  it('rejects a move on a finished game', () => {
    const board = createEmptyBoard()
    expect(() => applyMove(board, 0, 'X', 'X', 'won')).toThrow(InvalidMoveError)
  })

  it('rejects an out-of-bounds position', () => {
    const board = createEmptyBoard()
    expect(() => applyMove(board, 9, 'X', 'X', 'in_progress')).toThrow(InvalidMoveError)
  })
})
```

- [ ] **Step 5: Run the tests and verify they fail**

Run: `pnpm --filter @tic-tac-toe/backend test`
Expected: FAIL — `./logic` module not found (implementation doesn't exist yet).

- [ ] **Step 6: Implement `apps/backend/src/game/logic.ts`**

```ts
import type { Board, GameResult, GameStatus, Player } from '@tic-tac-toe/shared'

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function createEmptyBoard(): Board {
  return Array(9).fill(null)
}

export function evaluateBoard(board: Board): GameResult {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { status: 'won', winner: board[a] as Player }
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { status: 'draw', winner: null }
  }
  return { status: 'in_progress', winner: null }
}

export function nextPlayer(player: Player): Player {
  return player === 'X' ? 'O' : 'X'
}

export class InvalidMoveError extends Error {}

export function applyMove(
  board: Board,
  position: number,
  player: Player,
  currentPlayer: Player,
  status: GameStatus
): Board {
  if (status !== 'in_progress') {
    throw new InvalidMoveError('Game is already finished')
  }
  if (player !== currentPlayer) {
    throw new InvalidMoveError('Not your turn')
  }
  if (position < 0 || position > 8) {
    throw new InvalidMoveError('Position out of bounds')
  }
  if (board[position] !== null) {
    throw new InvalidMoveError('Cell already taken')
  }
  const next = [...board]
  next[position] = player
  return next
}
```

- [ ] **Step 7: Run the tests and verify they pass**

Run: `pnpm --filter @tic-tac-toe/backend test`
Expected: PASS, all 16 tests green.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/package.json apps/backend/tsconfig.json apps/backend/src/game
git commit -m "feat: add backend game logic with tests"
```

---

### Task 4: Backend state store, routes, and server

**Files:**
- Create: `apps/backend/src/game/state.ts`
- Create: `apps/backend/src/routes/games.ts`
- Create: `apps/backend/src/server.ts`

**Interfaces:**
- Consumes: `GameState`, `Player` from `@tic-tac-toe/shared`; `applyMove`, `evaluateBoard`, `nextPlayer`, `createEmptyBoard`, `InvalidMoveError` from `./game/logic` (Task 3).
- Produces: `createGame(): GameState`, `getGame(id: string): GameState | undefined`, `saveGame(game: GameState): void` from `state.ts`; `buildServer(): FastifyInstance` from `server.ts`, exported for future integration tests and used by the `start`/`dev` scripts.

- [ ] **Step 1: Create `apps/backend/src/game/state.ts`**

```ts
import { randomUUID } from 'node:crypto'
import type { GameState } from '@tic-tac-toe/shared'
import { createEmptyBoard } from './logic'

const games = new Map<string, GameState>()

export function createGame(): GameState {
  const game: GameState = {
    id: randomUUID(),
    board: createEmptyBoard(),
    currentPlayer: 'X',
    status: 'in_progress',
    winner: null,
  }
  games.set(game.id, game)
  return game
}

export function getGame(id: string): GameState | undefined {
  return games.get(id)
}

export function saveGame(game: GameState): void {
  games.set(game.id, game)
}
```

- [ ] **Step 2: Create `apps/backend/src/routes/games.ts`**

```ts
import type { FastifyInstance } from 'fastify'
import type { Player } from '@tic-tac-toe/shared'
import { createGame, getGame, saveGame } from '../game/state'
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

  app.post<{ Params: { id: string }; Body: { position: number; player: Player } }>(
    '/games/:id/moves',
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
          currentPlayer: nextPlayer(game.currentPlayer),
        }
        saveGame(updated)
        return updated
      } catch (err) {
        if (err instanceof InvalidMoveError) {
          return reply.code(409).send({ error: err.message })
        }
        throw err
      }
    }
  )
}
```

- [ ] **Step 3: Create `apps/backend/src/server.ts`**

```ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { gamesRoutes } from './routes/games'

export function buildServer() {
  const app = Fastify({ logger: true })
  app.register(cors, { origin: 'http://localhost:5173' })
  app.register(gamesRoutes)
  return app
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const app = buildServer()
  app.listen({ port: 3000 }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  })
}
```

- [ ] **Step 4: Manually verify the API end-to-end**

Run: `pnpm --filter @tic-tac-toe/backend dev` (leave running), then in another shell:

```bash
curl -s -X POST http://localhost:3000/games | tee /tmp/game.json
GAME_ID=$(node -pe "JSON.parse(require('fs').readFileSync('/tmp/game.json')).id")
curl -s -X POST http://localhost:3000/games/$GAME_ID/moves \
  -H 'Content-Type: application/json' \
  -d '{"position": 0, "player": "X"}'
curl -s http://localhost:3000/games/$GAME_ID
```

Expected: first call returns a game with an empty board and `currentPlayer: "X"`; the move call returns the updated board with `board[0] === "X"` and `currentPlayer: "O"`; the final GET reflects the same state. Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/game/state.ts apps/backend/src/routes apps/backend/src/server.ts
git commit -m "feat: add backend game state store, routes, and server"
```

---

### Task 5: Frontend scaffold and API client

**Files:**
- Create: `apps/frontend/package.json`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/index.html`
- Create: `apps/frontend/src/main.tsx`
- Create: `apps/frontend/src/setupTests.ts`
- Create: `apps/frontend/src/api/client.ts`

**Interfaces:**
- Consumes: `GameState`, `Player` from `@tic-tac-toe/shared`.
- Produces: `createGame(): Promise<GameState>`, `getGame(id: string): Promise<GameState>`, `makeMove(id: string, position: number, player: Player): Promise<GameState>` from `api/client.ts`, consumed by Task 6's `App.tsx`.

- [ ] **Step 1: Create `apps/frontend/package.json`**

```json
{
  "name": "@tic-tac-toe/frontend",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tic-tac-toe/shared": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `apps/frontend/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `apps/frontend/vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
```

- [ ] **Step 4: Create `apps/frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Tic-Tac-Toe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `apps/frontend/src/setupTests.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create `apps/frontend/src/api/client.ts`**

```ts
import type { GameState, Player } from '@tic-tac-toe/shared'

const BASE_URL = 'http://localhost:3000'

export async function createGame(): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games`, { method: 'POST' })
  return res.json()
}

export async function getGame(id: string): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${id}`)
  return res.json()
}

export async function makeMove(id: string, position: number, player: Player): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${id}/moves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position, player }),
  })
  if (!res.ok) {
    const body = await res.json()
    throw new Error(body.error ?? 'Move failed')
  }
  return res.json()
}
```

- [ ] **Step 7: Create `apps/frontend/src/main.tsx`** (references `App` from Task 6 — written now, satisfied next task)

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Install dependencies from repo root**

Run: `pnpm install`
Expected: no errors; `apps/frontend/node_modules` and root lockfile updated.

- [ ] **Step 9: Commit**

```bash
git add apps/frontend/package.json apps/frontend/tsconfig.json apps/frontend/vite.config.ts \
  apps/frontend/index.html apps/frontend/src/main.tsx apps/frontend/src/setupTests.ts \
  apps/frontend/src/api
git commit -m "feat: scaffold frontend app and API client"
```

---

### Task 6: Frontend Board component and App (TDD)

**Files:**
- Create: `apps/frontend/src/components/Board.tsx`
- Test: `apps/frontend/src/components/Board.test.tsx`
- Create: `apps/frontend/src/App.tsx`

**Interfaces:**
- Consumes: `Board` type from `@tic-tac-toe/shared`; `createGame`, `makeMove` from `../api/client` (Task 5).
- Produces: `Board` React component (`{ board: BoardType; onCellClick: (position: number) => void }`) and default-exported `App` component, the app's entry point.

- [ ] **Step 1: Write the failing test for `Board`**

Create `apps/frontend/src/components/Board.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Board } from './Board'

describe('Board', () => {
  it('renders 9 cells', () => {
    render(<Board board={Array(9).fill(null)} onCellClick={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(9)
  })

  it('calls onCellClick with the clicked position', () => {
    const handleClick = vi.fn()
    render(<Board board={Array(9).fill(null)} onCellClick={handleClick} />)
    fireEvent.click(screen.getAllByRole('button')[4])
    expect(handleClick).toHaveBeenCalledWith(4)
  })

  it('disables cells that are already filled', () => {
    const board = Array(9).fill(null)
    board[0] = 'X'
    render(<Board board={board} onCellClick={() => {}} />)
    expect(screen.getAllByRole('button')[0]).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `pnpm --filter @tic-tac-toe/frontend test`
Expected: FAIL — `./Board` module not found.

- [ ] **Step 3: Implement `apps/frontend/src/components/Board.tsx`**

```tsx
import type { Board as BoardType } from '@tic-tac-toe/shared'

interface BoardProps {
  board: BoardType
  onCellClick: (position: number) => void
}

export function Board({ board, onCellClick }: BoardProps) {
  return (
    <div className="board" role="grid">
      {board.map((cell, index) => (
        <button
          key={index}
          className="cell"
          onClick={() => onCellClick(index)}
          disabled={cell !== null}
        >
          {cell}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `pnpm --filter @tic-tac-toe/frontend test`
Expected: PASS, all 3 tests green.

- [ ] **Step 5: Implement `apps/frontend/src/App.tsx`**

```tsx
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
```

- [ ] **Step 6: Manually verify the app runs end-to-end**

Run backend in one shell: `pnpm --filter @tic-tac-toe/backend dev`
Run frontend in another shell: `pnpm --filter @tic-tac-toe/frontend dev`
Open `http://localhost:5173` in a browser.

Expected: an empty 3x3 board loads, "Turn: X" shows, clicking a cell fills it and switches to "Turn: O", playing out a full line shows "Winner: X" (or O), and filling the board with no line shows "Draw!". Stop both dev servers after checking.

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/components apps/frontend/src/App.tsx
git commit -m "feat: add frontend Board component and App"
```
