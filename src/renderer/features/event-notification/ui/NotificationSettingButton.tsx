import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { useNotificationSettings } from '../model/notification-settings-context';

export function NotificationSettingButton() {
  const { enabled, leadMinutes, leadMinutesIndex, toggleEnabled, changeLeadMinutes } = useNotificationSettings();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-row items-center justify-between gap-4">
        <label htmlFor="notification-setting-toggle">알림</label>
        <Switch id="notification-setting-toggle" onClick={toggleEnabled} isOn={enabled} />
      </div>
      {enabled && (
        <>
          <div className="border-main-color/30 bg-main-color/12 relative flex items-start gap-2 rounded-lg border px-2.5 py-2">
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
