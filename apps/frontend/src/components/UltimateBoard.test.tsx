import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SubBoardResult } from '@tic-tac-toe/shared'
import { UltimateBoard } from './UltimateBoard'

const emptyBoard = () => Array(81).fill(null)
const openResults = (): SubBoardResult[] => Array(9).fill(null)

describe('UltimateBoard', () => {
  it('renders nine sub-boards of nine cells', () => {
    render(<UltimateBoard board={emptyBoard()} subBoardResults={openResults()} activeSubBoard={null} onCellClick={() => {}} />)
    expect(screen.getAllByRole('group')).toHaveLength(9)
    expect(screen.getAllByRole('button')).toHaveLength(81)
  })

  it('calls onCellClick with the absolute position', () => {
    const handleClick = vi.fn()
    render(<UltimateBoard board={emptyBoard()} subBoardResults={openResults()} activeSubBoard={null} onCellClick={handleClick} />)
    fireEvent.click(within(screen.getByLabelText('Tabuleiro 5')).getAllByRole('button')[7])
    expect(handleClick).toHaveBeenCalledWith(43)
  })

  it('only enables cells of the active sub-board', () => {
    render(<UltimateBoard board={emptyBoard()} subBoardResults={openResults()} activeSubBoard={2} onCellClick={() => {}} />)
    const active = screen.getByLabelText('Tabuleiro 3')
    expect(active).toHaveClass('sub-board-active')
    within(active).getAllByRole('button').forEach((cell) => expect(cell).toBeEnabled())
    within(screen.getByLabelText('Tabuleiro 1')).getAllByRole('button').forEach((cell) => expect(cell).toBeDisabled())
  })

  it('disables decided sub-boards and shows their owner', () => {
    const results = openResults()
    results[0] = 'O'
    render(<UltimateBoard board={emptyBoard()} subBoardResults={results} activeSubBoard={null} onCellClick={() => {}} />)
    const decided = screen.getByLabelText('Tabuleiro 1')
    expect(decided).toHaveClass('sub-board-decided')
    expect(decided).toHaveTextContent('O')
    within(decided).getAllByRole('button').forEach((cell) => expect(cell).toBeDisabled())
  })

  it('highlights the winning sub-boards', () => {
    const results: SubBoardResult[] = ['X', 'X', 'X', null, null, null, null, null, null]
    render(
      <UltimateBoard
        board={emptyBoard()}
        subBoardResults={results}
        activeSubBoard={null}
        onCellClick={() => {}}
        winningLine={[0, 1, 2]}
        disabled
      />
    )
    expect(screen.getByLabelText('Tabuleiro 1')).toHaveClass('sub-board-winning')
    expect(screen.getByLabelText('Tabuleiro 4')).not.toHaveClass('sub-board-winning')
  })
})
