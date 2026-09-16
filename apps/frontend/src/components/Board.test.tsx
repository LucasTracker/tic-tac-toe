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
