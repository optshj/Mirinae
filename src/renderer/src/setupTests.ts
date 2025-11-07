import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import '@testing-library/jest-dom';

beforeAll(() => {
    // @ts-ignore 혹은 타입 선언 추가
    window.api = {
        tryAutoLogin: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
        onGoogleOauthSuccess: vi.fn(),
        onGoogleOauthError: vi.fn()
    };
});
afterEach(() => {
    vi.clearAllMocks();
});

afterAll(() => {
    vi.resetAllMocks();
});
