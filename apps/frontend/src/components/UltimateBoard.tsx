import type { Board as BoardType, SubBoardResult } from '@tic-tac-toe/shared'

const SUB_BOARD_CELLS = 9

interface UltimateBoardProps {
  /** 81 cells, where position = subBoard * 9 + cell. */
  board: BoardType
  subBoardResults: SubBoardResult[]
  activeSubBoard: number | null
  onCellClick: (position: number) => void
  /** Indices of the sub-boards that won the game. */
  winningLine?: number[] | null
  disabled?: boolean
}

export function UltimateBoard({
  board,
  subBoardResults,
  activeSubBoard,
  onCellClick,
  winningLine,
  disabled = false,
}: UltimateBoardProps) {
  return (
    <div className="ultimate-board" role="grid" aria-label="Tabuleiro Ultimate">
      {subBoardResults.map((result, subBoard) => {
        const playable = !disabled && result === null && (activeSubBoard === null || activeSubBoard === subBoard)
        const classNames = ['sub-board']
        if (playable) classNames.push('sub-board-active')
        if (result !== null) classNames.push('sub-board-decided')
        if (winningLine?.includes(subBoard)) classNames.push('sub-board-winning')

        return (
          <div key={subBoard} className={classNames.join(' ')} role="group" aria-label={`Tabuleiro ${subBoard + 1}`}>
            {board.slice(subBoard * SUB_BOARD_CELLS, (subBoard + 1) * SUB_BOARD_CELLS).map((cell, index) => {
              const position = subBoard * SUB_BOARD_CELLS + index
              return (
                <button
                  key={position}
                  className="cell ultimate-cell"
                  onClick={() => onCellClick(position)}
                  disabled={!playable || cell !== null}
                >
                  {cell}
                </button>
              )
            })}
            {result !== null && (
              <span className="sub-board-owner" aria-hidden="true">
                {result === 'draw' ? '–' : result}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
