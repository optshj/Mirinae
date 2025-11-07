import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DarkModeButton } from './DarkModeButton';

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        })
    };
})();

function mockMatchMedia(matches: boolean) {
    return vi.fn().mockImplementation(() => ({
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }));
}

describe('DarkModeButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-expect-error
        global.localStorage = localStorageMock;
        window.matchMedia = mockMatchMedia(false); // 기본: 라이트 모드
        document.documentElement.className = '';
    });

    it('라이트 모드에서 렌더링 되어야 함', () => {
        render(<DarkModeButton />);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('prefers-color-scheme이 dark일 때 다크 모드로 시작해야 함', () => {
        window.matchMedia = mockMatchMedia(true);
        render(<DarkModeButton />);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('클릭 시 다크모드로 전환되어야 함', () => {
        render(<DarkModeButton />);
        const toggle = screen.getByRole('button', { hidden: true });
        fireEvent.click(toggle);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('다크 모드 상태에서 클릭 시 라이트 모드로 전환되어야 함', () => {
        localStorageMock.getItem.mockReturnValueOnce('dark');
        render(<DarkModeButton />);
        const toggle = screen.getByRole('button', { hidden: true });
        fireEvent.click(toggle);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });
});
