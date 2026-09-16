# Tic-Tac-Toe Monorepo Scaffolding — Design

## Goal

Scaffold a frontend + backend monorepo for a tic-tac-toe game. Two local
players (or vs a future bot), no real-time multiplayer, no persistence.

## Stack

- **Backend**: Node.js + Fastify + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Shared types**: internal workspace package
- **Package manager / workspace**: pnpm workspaces
- **Testing**: Vitest in both apps
- **State**: in-memory on backend (lost on restart — acceptable for current scope)
- **CI**: out of scope for this pass

## Repository layout

```
tic-tac-toe/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   └── Board.tsx
│   │   │   └── api/
│   │   │       └── client.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── backend/
│       ├── src/
│       │   ├── server.ts
│       │   ├── routes/
│       │   │   └── games.ts
│       │   ├── game/
│       │   │   ├── state.ts       (in-memory store)
│       │   │   └── logic.ts       (win/draw detection, move validation)
│       │   └── game/logic.test.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   └── types.ts   (Board, Player, GameState, Move, GameResult)
│       ├── package.json
│       └── tsconfig.json
├── package.json            (workspace root scripts: dev, build, test, lint)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .gitignore
```

## Backend

Fastify server exposing a REST API for game state:

- `POST /games` — create a new game, returns `{ id, board, currentPlayer, status }`
- `GET /games/:id` — fetch current game state
- `POST /games/:id/moves` — body `{ position: number, player: 'X' | 'O' }`, applies
  move, returns updated state or 409/400 on invalid move (not your turn, cell
  taken, game already finished)

Game state lives in a `Map<string, GameState>` in `game/state.ts`. Win/draw
detection and move validation are pure functions in `game/logic.ts`, unit
tested with Vitest (the standard 8 winning lines, draw, invalid-move
rejection).

CORS enabled for the Vite dev origin in development.

## Frontend

React app rendering a 3x3 board. `api/client.ts` wraps fetch calls to the
backend (create game, get state, submit move). `Board.tsx` renders cells and
dispatches clicks as moves. `App.tsx` holds game id in state, shows whose
turn it is, and the result (winner/draw) when the game ends.

## Shared package

`@tic-tac-toe/shared` exports the TypeScript types used by both apps
(`Board`, `Player`, `GameState`, `Move`, `GameResult`) so the request/response
shapes can't drift between frontend and backend. Built as a plain TS
workspace package (no bundling step needed — both apps consume the source
via workspace reference / project references).

## Testing

- Backend: Vitest unit tests for `game/logic.ts` (win detection for all 8
  lines, draw detection, invalid move rejection).
- Frontend: Vitest + React Testing Library smoke test for `Board.tsx`
  (renders 9 cells, click calls the move handler).

## Out of scope

- Real-time multiplayer / WebSockets
- Persistence (database)
- CI/CD pipeline
- Bot/AI opponent (types leave room for it, no implementation)
- Auth / user accounts
