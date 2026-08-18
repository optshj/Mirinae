import { createContext, useContext, useEffect, useState } from 'react';
import { posthog } from '@/shared/lib/posthog';

export const LEAD_MINUTES_OPTIONS = [5, 10, 15, 30] as const;

function nearestLeadMinutesIndex(value: number) {
  return LEAD_MINUTES_OPTIONS.reduce((closestIndex, option, index) => (Math.abs(option - value) < Math.abs(LEAD_MINUTES_OPTIONS[closestIndex] - value) ? index : closestIndex), 0);
}

interface NotificationSettingsContextValue {
  enabled: boolean;
  leadMinutes: number;
  leadMinutesIndex: number;
  toggleEnabled: () => void;
  changeLeadMinutes: (nextIndex: number) => void;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextValue | null>(null);

export function NotificationSettingsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [leadMinutesIndex, setLeadMinutesIndex] = useState(1);

  useEffect(() => {
    Promise.all([window.api.getNotificationsEnabled(), window.api.getNotificationLeadMinutes()]).then(([initialEnabled, initialLeadMinutes]) => {
      setEnabled(initialEnabled);
      setLeadMinutesIndex(nearestLeadMinutesIndex(initialLeadMinutes));
    });
  }, []);

  const toggleEnabled = () => {
    setEnabled((prev) => {
      const next = !prev;
      window.api.setNotificationsEnabled(next);
      posthog.capture('notifications_enabled_changed', { notifications_enabled: next });
      return next;
    });
  };

  const changeLeadMinutes = (nextIndex: number) => {
    const clampedIndex = Math.min(Math.max(nextIndex, 0), LEAD_MINUTES_OPTIONS.length - 1);
    setLeadMinutesIndex(clampedIndex);
    const value = LEAD_MINUTES_OPTIONS[clampedIndex];
    window.api.setNotificationLeadMinutes(value);
    posthog.capture('notification_lead_minutes_changed', { notification_lead_minutes: value });
  };

  return (
    <NotificationSettingsContext.Provider value={{ enabled, leadMinutes: LEAD_MINUTES_OPTIONS[leadMinutesIndex], leadMinutesIndex, toggleEnabled, changeLeadMinutes }}>
      {children}
    </NotificationSettingsContext.Provider>
  );
}

export function useNotificationSettings() {
  const ctx = useContext(NotificationSettingsContext);
  if (!ctx) throw new Error('useNotificationSettings must be used within NotificationSettingsProvider');
  return ctx;
}
