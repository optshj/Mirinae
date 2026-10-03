import { CalendarCheck2, Check } from 'lucide-react';
import { useCalendarVisibility, useHoliday, useSubscribedCalendars } from '@/entities/event';
import { cn } from '@/shared/lib/utils';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { Tooltip } from '@/shared/ui/tooltip';
import { posthog } from '@/shared/lib/posthog';

export function CalendarListButton() {
  const { showHoliday, setShowHoliday } = useHoliday();
  const { setVisibleIds } = useCalendarVisibility();
  const calendars = useSubscribedCalendars();

  const keepOpen = (event: Event) => event.preventDefault();
  const toggle = (id: string, checked: boolean) => {
    setVisibleIds(calendars.filter((cal) => (cal.id === id ? checked : cal.visible)).map((cal) => cal.id));
    posthog.capture('calendar_visibility_changed', { calendar: 'subscribed', visible: checked });
  };
  const toggleHoliday = (checked: boolean) => {
    setShowHoliday(checked);
    posthog.capture('calendar_visibility_changed', { calendar: 'holiday', visible: checked });
  };
  const itemClass = 'pr-1.5 [&>[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden';

  return (
    <DropdownMenu>
      <Tooltip content="표시할 캘린더" side="bottom">
        <DropdownMenuTrigger asChild>
          <div className="data-[state=open]:text-main-color inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 transition-colors [&_svg]:pointer-events-none">
            <CalendarCheck2 strokeWidth={1} />
          </div>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-primary text-xs">표시할 캘린더</DropdownMenuLabel>
        <DropdownMenuCheckboxItem className={itemClass} checked={showHoliday} onCheckedChange={toggleHoliday} onSelect={keepOpen}>
          <ColorCheckbox colorId="10" checked={showHoliday} />
          <span className="truncate">대한민국 공휴일</span>
        </DropdownMenuCheckboxItem>
        {calendars.map((cal) => (
          <DropdownMenuCheckboxItem key={cal.id} className={itemClass} checked={cal.visible} onCheckedChange={(checked) => toggle(cal.id, checked)} onSelect={keepOpen}>
            <ColorCheckbox colorId={cal.colorId} checked={cal.visible} />
            <span className="truncate">{cal.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColorCheckbox({ colorId, checked }: { colorId: string; checked: boolean }) {
  return (
    <span
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] border-(--event-color) transition-colors duration-200 dark:saturate-70',
        `event-color-${colorId}`,
        checked && 'bg-(--event-color)'
      )}
    >
      {checked && <Check color="white" strokeWidth={3.5} className="animate-in fade-in-0 zoom-in-50 size-3 duration-200 motion-reduce:animate-none" />}
    </span>
  );
}
