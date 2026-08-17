import { useEffect, useState } from 'react';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { posthog } from '@/shared/lib/posthog';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';

const LEAD_MINUTES_OPTIONS = [5, 10, 15, 30] as const;

function nearestLeadMinutesIndex(value: number) {
  return LEAD_MINUTES_OPTIONS.reduce((closestIndex, option, index) => (Math.abs(option - value) < Math.abs(LEAD_MINUTES_OPTIONS[closestIndex] - value) ? index : closestIndex), 0);
}

export function NotificationSettingButton() {
  const [enabled, setEnabled] = useState(true);
  const [leadMinutesIndex, setLeadMinutesIndex] = useState(1);

  useEffect(() => {
    async function fetchSettings() {
      const [initialEnabled, initialLeadMinutes] = await Promise.all([window.api.getNotificationsEnabled(), window.api.getNotificationLeadMinutes()]);
      setEnabled(initialEnabled);
      setLeadMinutesIndex(nearestLeadMinutesIndex(initialLeadMinutes));
    }
    fetchSettings();
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

  const leadMinutes = LEAD_MINUTES_OPTIONS[leadMinutesIndex];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-row items-center justify-between gap-4">
        <label htmlFor="notification-setting-toggle">알림</label>
        <Switch id="notification-setting-toggle" onClick={toggleEnabled} isOn={enabled} />
      </div>
      {enabled && (
        <>
          <div className="border-main-color/30 bg-layer relative flex items-start gap-2 rounded-lg border px-2.5 py-2">
            <span className="bg-muted text-muted-foreground absolute top-1.5 right-2 rounded px-1 text-[8.5px] font-bold tracking-wide">미리보기</span>
            <div className="bg-main-color flex size-5 shrink-0 items-center justify-center rounded-md text-white">
              <Bell size={12} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">일정</span>
              <span className="text-secondary text-[11px]">{leadMinutes}분 후 시작</span>
            </div>
          </div>
          <div className="flex flex-row justify-between">
            <label htmlFor="notification-lead-minutes-stepper" className="text-secondary text-xs">
              알림 시점
            </label>
            <div id="notification-lead-minutes-stepper" className="flex items-center gap-0.5">
              <Button variant="outline" size="icon" className="size-5" tabIndex={-1} onClick={() => changeLeadMinutes(leadMinutesIndex - 1)}>
                <ChevronDown />
              </Button>
              <span className="justify-center px-1 text-xs font-semibold whitespace-nowrap">{leadMinutes}분 전</span>
              <Button variant="outline" size="icon" className="size-5" tabIndex={-1} onClick={() => changeLeadMinutes(leadMinutesIndex + 1)}>
                <ChevronUp />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
