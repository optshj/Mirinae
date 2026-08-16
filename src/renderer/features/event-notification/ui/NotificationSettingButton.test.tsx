import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationSettingButton } from './NotificationSettingButton';

describe('NotificationSettingButton', () => {
  beforeEach(() => {
    window.api = {
      ...window.api,
      getNotificationsEnabled: vi.fn().mockResolvedValue(true),
      setNotificationsEnabled: vi.fn()
    } as typeof window.api;
  });

  it('초기값을 불러와 렌더링 되어야 함', async () => {
    render(<NotificationSettingButton />);
    await waitFor(() => expect(window.api.getNotificationsEnabled).toHaveBeenCalled());
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('클릭 시 알림 설정을 토글하고 저장해야 함', async () => {
    render(<NotificationSettingButton />);
    await waitFor(() => expect(window.api.getNotificationsEnabled).toHaveBeenCalled());

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(window.api.setNotificationsEnabled).toHaveBeenCalledWith(false);
  });
});
