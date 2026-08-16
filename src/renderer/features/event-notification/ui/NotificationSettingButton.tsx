import { useEffect, useState } from 'react';
import { posthog } from '@/shared/lib/posthog';
import { Switch } from '@/shared/ui/switch';

export function NotificationSettingButton() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    async function fetchEnabled() {
      const initialEnabled = await window.api.getNotificationsEnabled();
      setEnabled(initialEnabled);
    }
    fetchEnabled();
  }, []);

  const toggleEnabled = () => {
    setEnabled((prev) => {
      const next = !prev;
      window.api.setNotificationsEnabled(next);
      posthog.capture('notifications_enabled_changed', { notifications_enabled: next });
      return next;
    });
  };

  return (
    <div className="flex flex-row items-center justify-between gap-4">
      <label htmlFor="notification-setting-toggle">알림</label>
      <Switch id="notification-setting-toggle" onClick={toggleEnabled} isOn={enabled} />
    </div>
  );
}
