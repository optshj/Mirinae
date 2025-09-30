import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddEventForm } from './AddEventForm'
import { toast } from 'sonner'

const mockAddEvent = vi.fn()

vi.mock('sonner', () => ({
    toast: Object.assign(vi.fn(), {
        success: vi.fn(),
        warning: vi.fn()
    })
}))
vi.mock('./AddEventForm.mutation', () => ({
    useAddEvent: () => ({
        addEvent: (event: any) => mockAddEvent(event)
    })
}))

describe('AddEventForm', () => {
    const date = new Date('2025-08-16T09:00:00Z')
    beforeEach(() => {
        render(<AddEventForm date={date} />)
        expect(screen.getByText('+ 일정 추가')).toBeInTheDocument()
    })

    it('기본적으로 "+ 일정 추가" 버튼만 보인다', () => {
        expect(screen.queryByText(/일정 제목/i)).not.toBeInTheDocument()
    })

    it('버튼 클릭 시 일정 추가 폼이 열린다', async () => {
        fireEvent.click(screen.getByText('+ 일정 추가'))
        expect(await screen.findByLabelText(/일정 제목/i)).toBeInTheDocument()
    })

    it('Crtl + Enter키로 일정 추가 폼이 열린다', async () => {
        fireEvent.keyDown(screen.getByText('+ 일정 추가'), { ctrlKey: true, key: 'Enter' })
        expect(await screen.findByLabelText(/일정 제목/i)).toBeInTheDocument()
    })

    it('일정 제목 없이 제출하면 토스트로 에러 메시지를 보여준다', async () => {
        fireEvent.click(screen.getByText('+ 일정 추가'))
        fireEvent.click(screen.getByRole('button', { name: '추가' }))
        expect(toast.warning).toHaveBeenCalledWith('일정 제목을 입력해주세요')
    })

    it('일정 제목에 입력이 가능하다', async () => {
        fireEvent.click(screen.getByText('+ 일정 추가'))
        fireEvent.change(screen.getByPlaceholderText('일정을 입력해주세요'), { target: { value: '테스트 일정' } })
        expect(await screen.findByDisplayValue('테스트 일정')).toBeInTheDocument()
    })

    it('정상 입력 시 일정이 추가된다', () => {
        fireEvent.click(screen.getByText('+ 일정 추가'))
        fireEvent.change(screen.getByPlaceholderText('일정을 입력해주세요'), { target: { value: '회의' } })

        fireEvent.click(screen.getByRole('button', { name: '추가' }))
        expect(mockAddEvent).toHaveBeenCalledWith({
            date: date,
            startTime: '08:00',
            endTime: '12:00',
            summary: '회의',
            colorId: '1'
        })
    })

    it('Ctrl + Enter로 제출이 가능하다', () => {
        fireEvent.click(screen.getByText('+ 일정 추가'))
        fireEvent.change(screen.getByPlaceholderText('일정을 입력해주세요'), { target: { value: '테스트 일정' } })

        fireEvent.keyDown(screen.getByRole('button', { name: '추가' }), { ctrlKey: true, key: 'Enter' })
        expect(mockAddEvent).toHaveBeenCalledWith({
            date: date,
            startTime: '08:00',
            endTime: '12:00',
            summary: '테스트 일정',
            colorId: '1'
        })
    })
})
