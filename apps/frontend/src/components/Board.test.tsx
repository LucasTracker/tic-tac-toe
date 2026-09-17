import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Board as BoardType } from '@tic-tac-toe/shared'
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

  it('highlights the winning line cells', () => {
    const board: BoardType = ['X', 'X', 'X', null, null, null, null, null, null]
    render(<Board board={board} onCellClick={() => {}} winningLine={[0, 1, 2]} />)
    const cells = screen.getAllByRole('button')
    expect(cells[0]).toHaveClass('cell-winning')
    expect(cells[1]).toHaveClass('cell-winning')
    expect(cells[2]).toHaveClass('cell-winning')
    expect(cells[3]).not.toHaveClass('cell-winning')
  })
})
