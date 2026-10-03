import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

function mockMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

// 설정 스토어가 모듈 로드 시점에 저장값·시스템 테마를 읽으므로 매번 새로 불러온다
async function setup() {
  vi.resetModules();
  const { applyPreferencesToHtml } = await import('@/shared/lib/preferences');
  const { DarkModeButton } = await import('./DarkModeButton');
  applyPreferencesToHtml();
  render(<DarkModeButton />);
}

describe('DarkModeButton', () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = mockMatchMedia(false); // 기본: 라이트 모드
    document.documentElement.className = '';
  });

  it('라이트 모드에서 렌더링 되어야 함', async () => {
    await setup();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('prefers-color-scheme이 dark일 때 다크 모드로 시작해야 함', async () => {
    window.matchMedia = mockMatchMedia(true);
    await setup();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('다크 카드 클릭 시 다크모드로 전환되어야 함', async () => {
    await setup();
    fireEvent.click(screen.getByText('다크'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('다크 모드 상태에서 라이트 카드 클릭 시 라이트 모드로 전환되어야 함', async () => {
    localStorage.setItem('theme', 'dark');
    await setup();
    fireEvent.click(screen.getByText('라이트'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
