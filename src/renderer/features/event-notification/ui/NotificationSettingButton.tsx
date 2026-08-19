import { Switch } from '@/shared/ui/switch';
import { cn } from '@/shared/lib/utils';
import { LEAD_MINUTES_OPTIONS, useNotificationSettings } from '../model/notificationSettingsContext';

export function NotificationSettingButton() {
  const { enabled, leadMinutes, leadMinutesIndex, toggleEnabled, changeLeadMinutes } = useNotificationSettings();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-row items-center justify-between gap-4">
        <label htmlFor="notification-setting-toggle">일정 알림</label>
        <Switch id="notification-setting-toggle" onClick={toggleEnabled} isOn={enabled} />
      </div>
      {enabled && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-secondary text-xs">알림 시점</span>
            <div role="tablist" aria-label="알림 시점" className="grid grid-cols-4 gap-0.5 rounded-md bg-black/5 p-0.5 dark:bg-white/10">
              {LEAD_MINUTES_OPTIONS.map((minutes, index) => (
                <button
                  key={minutes}
                  type="button"
                  role="tab"
                  aria-selected={index === leadMinutesIndex}
                  tabIndex={-1}
                  onClick={() => changeLeadMinutes(index)}
                  className={cn(
                    'rounded px-1 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors',
                    index === leadMinutesIndex ? 'bg-main-color text-white shadow-xs' : 'text-primary/55 hover:text-primary'
                  )}
                >
                  {minutes}분
                </button>
              ))}
            </div>
          </div>
          <div className="border-main-color/30 bg-main-color/12 relative flex items-start gap-2 rounded-lg border px-2.5 py-2">
            <span className="bg-muted text-muted-foreground absolute top-1.5 right-2 rounded px-1 text-[8.5px] font-bold tracking-wide">예시</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">일정 이름</span>
              <span className="text-secondary text-[11px]">{leadMinutes}분 후 시작</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
