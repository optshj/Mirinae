import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HolidayButton } from './HolidayButton';

const mockHandleShow = vi.fn();
let mockIsShow = false;

vi.mock('../../model/ShowHolidayContext', () => ({
    useShowHoliday: () => ({
        isShow: mockIsShow,
        handleShow: mockHandleShow
    })
}));

describe('HolidayButton', () => {
    beforeEach(() => {
        mockHandleShow.mockClear();
    });

    it('버튼 클릭 시 handleShow 함수가 호출되어 공휴일 표시 유무가 바뀐다.', () => {
        mockIsShow = false;
        render(<HolidayButton />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(mockHandleShow).toHaveBeenCalledTimes(1);
    });
});
