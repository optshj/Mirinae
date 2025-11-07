import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlipButton } from './FlipButton';

const mockFlipCalendar = vi.fn();

vi.mock('../../model/FlipCalendarContext', () => ({
    useFlipCalendar: () => ({
        flipCalendar: mockFlipCalendar
    })
}));

describe('FlipButton', () => {
    beforeEach(() => {
        mockFlipCalendar.mockClear();
    });

    it('버튼이 렌더링 된다', () => {
        render(<FlipButton />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });
});
