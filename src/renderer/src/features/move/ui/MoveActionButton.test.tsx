import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MoveActiveButton } from './MoveActiveButton';

describe('MoveActiveButton', () => {
    beforeEach(() => {
        window.api = {
            ...window.api,
            startDragging: vi.fn(),
            stopDragging: vi.fn()
        };
        document.documentElement.classList.remove('resizable');
    });

    it('"화면조절 시작" 버튼이 보인다.', () => {
        render(<MoveActiveButton />);
        expect(screen.getByText('화면조절 시작')).toBeInTheDocument();
    });

    it('"화면조절 시작" 버튼을 누르면 "화면조절 종료"버튼으로 바뀌고, 드래그 상태로 전환된다.', async () => {
        render(<MoveActiveButton />);
        expect(screen.getByText('화면조절 시작')).toBeInTheDocument();
        const trigger = screen.getByText('화면조절 시작');
        fireEvent.click(trigger);
        expect(await screen.findByText('화면조절 종료')).toBeInTheDocument();
        // startDargging
        expect(window.api.startDragging).toHaveBeenCalledTimes(1);
        expect(document.documentElement.classList.contains('resizable')).toBe(true);
    });

    it('"화면조절 종료"버튼을 누르면 창이 닫히고 드래그가 종료된다.', async () => {
        render(<MoveActiveButton />);
        const trigger = screen.getByText('화면조절 시작');
        fireEvent.click(trigger);
        const closeButton = screen.getByRole('button', { name: '적용' });
        fireEvent.click(closeButton);
        expect(window.api.stopDragging).toHaveBeenCalledTimes(1);
        expect(await screen.findByText('화면조절 시작')).toBeInTheDocument();
        expect(document.documentElement.classList.contains('resizable')).toBe(false);
    });
});
