import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import '@testing-library/jest-dom';

beforeAll(() => {
  // @ts-ignore 혹은 타입 선언 추가
  window.api = {
    restoreSession: vi.fn().mockResolvedValue(true),
    onAuthExpired: vi.fn(() => () => {})
  };
});
afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.resetAllMocks();
});
