import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationSettingButton } from './NotificationSettingButton';

describe('NotificationSettingButton', () => {
  beforeEach(() => {
    window.api = {
      ...window.api,
      getNotificationsEnabled: vi.fn().mockResolvedValue(true),
      setNotificationsEnabled: vi.fn(),
      getNotificationLeadMinutes: vi.fn().mockResolvedValue(10),
      setNotificationLeadMinutes: vi.fn()
    } as typeof window.api;
  });

  it('초기값을 불러와 렌더링 되어야 함', async () => {
    render(<NotificationSettingButton />);
    await waitFor(() => expect(window.api.getNotificationsEnabled).toHaveBeenCalled());
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText('10분 전')).toBeInTheDocument();
  });

  it('클릭 시 알림 설정을 토글하고 저장해야 함', async () => {
    render(<NotificationSettingButton />);
    await waitFor(() => expect(window.api.getNotificationsEnabled).toHaveBeenCalled());

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(window.api.setNotificationsEnabled).toHaveBeenCalledWith(false);
  });

  it('알림이 꺼져 있으면 알림 시점 컨트롤이 보이지 않아야 함', async () => {
    window.api.getNotificationsEnabled = vi.fn().mockResolvedValue(false);
    render(<NotificationSettingButton />);
    await waitFor(() => expect(window.api.getNotificationsEnabled).toHaveBeenCalled());

    expect(screen.queryByText(/분 전/)).not.toBeInTheDocument();
  });

  it('알림 시점을 낮추면 저장되어야 함', async () => {
    render(<NotificationSettingButton />);
    await waitFor(() => expect(screen.getByText('10분 전')).toBeInTheDocument());

    const [decreaseButton] = screen.getAllByRole('button');
    fireEvent.click(decreaseButton);

    expect(window.api.setNotificationLeadMinutes).toHaveBeenCalledWith(5);
  });
});
