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
