import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FlipButton } from './FlipButton'

const mockFlipCalendar = vi.fn()

vi.mock('../../model/FlipCalendarContext', () => ({
    useFlipCalendar: () => ({
        flipCalendar: mockFlipCalendar
    })
}))

describe('FlipButton', () => {
    beforeEach(() => {
        mockFlipCalendar.mockClear()
    })

    it('버튼이 렌더링 된다', () => {
        render(<FlipButton />)
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
    })

    it('버튼 클릭 시 flipCalendar 함수가 호출되어 캘린더가 접힌다.', () => {
        render(<FlipButton />)
        const button = screen.getByRole('button')
        fireEvent.click(button)
        expect(mockFlipCalendar).toHaveBeenCalledTimes(1)
    })
})
