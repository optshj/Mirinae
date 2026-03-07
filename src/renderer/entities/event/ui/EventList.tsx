import dayjs from 'dayjs';
import { CalendarEvent } from '@/shared/types/EventType';

const MAX_VISIBLE = 3;

function formatDateTime(dateField: { date?: string; dateTime?: string; timeZone?: string }) {
  if (!dateField.dateTime) {
    return null;
  }
  const d = dayjs(dateField.dateTime).locale('en');
  return d.format(d.minute() === 0 ? 'h A' : 'h:mm A');
}

export function EventList({ items }: { items: CalendarEvent[] }) {
  const visibleItems = items.slice(0, MAX_VISIBLE);
  const remainingCount = items.length - MAX_VISIBLE;

  return (
    <div className="flex flex-col justify-center gap-1 px-1">
      {visibleItems.map((event, i) => {
        const isCompleted = event.extendedProperties?.private?.isCompleted === 'true';
        const isHoliday = event.category === 'holiday';
        const statusClasses = [isCompleted ? 'opacity-50' : 'opacity-100', isHoliday ? '[html:not(.show-holiday)_&]:hidden' : ''].join(' ');

        return (
          <div key={event.id || i} className={`line-clamp-1 flex items-center rounded-sm text-sm dark:saturate-70 event-color-${event.colorId} md:bg-(--event-color)/20 md:pr-1 ${statusClasses}`}>
            <div className="mx-2 h-2.5 w-full rounded-full bg-(--event-color) shadow-sm md:hidden" />

            <div className="mr-1 hidden w-2 shrink-0 self-stretch rounded-l-sm bg-(--event-color) md:inline-block" />
            <span className="text-primary hidden truncate py-0.5 text-xs md:block">
              {formatDateTime(event.start)} {event.summary}
            </span>
          </div>
        );
      })}
      {remainingCount > 0 && <div className="text-secondary ml-1 truncate text-[10px] md:ml-2 md:text-xs">+{remainingCount}</div>}
    </div>
  );
}
