import type { Board as BoardType } from '@tic-tac-toe/shared'

interface BoardProps {
  board: BoardType
  onCellClick: (position: number) => void
  winningLine?: number[] | null
}

export function Board({ board, onCellClick, winningLine }: BoardProps) {
  return (
    <div className="board" role="grid">
      {board.map((cell, index) => {
        const isWinning = winningLine?.includes(index) ?? false
        return (
          <button
            key={index}
            className={isWinning ? 'cell cell-winning' : 'cell'}
            onClick={() => onCellClick(index)}
            disabled={cell !== null}
          >
            {cell}
          </button>
        )
      })}
    </div>
  )
}
