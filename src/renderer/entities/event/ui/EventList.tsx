import dayjs from 'dayjs';
import { CalendarEvent, isHolidayEvent } from '@/shared/types/EventType';

const MAX_VISIBLE = 3; // 보여줄 최대 개수

function formatDateTime(dateField: { date?: string; dateTime?: string; timeZone?: string }) {
    if (!dateField.dateTime) {
        return null;
    }

    const d = dayjs(dateField.dateTime).locale('en');
    const formatStr = d.minute() === 0 ? 'h A' : 'h:mm A';

    return d.format(formatStr);
}

export function EventList({ items }: { items: CalendarEvent[] }) {
    const visibleItems = items.slice(0, MAX_VISIBLE);
    const remainingCount = items.length - MAX_VISIBLE;

    return (
        <div className="flex flex-col gap-1 px-1">
            {visibleItems.map((event, i) => {
                const isCompleted = event.extendedProperties?.private?.isCompleted === 'true';
                const isHoliday = isHolidayEvent(event);

                const statusClasses = [isCompleted ? 'opacity-50' : 'opacity-100', isHoliday ? '[html:not(.show-holiday)_&]:hidden' : ''].join(' ');

                return (
                    <div key={event.id || i} className={`line-clamp-1 flex items-center rounded-sm pr-1 text-sm dark:saturate-70 event-color-${event.colorId} bg-(--event-color)/20 ${statusClasses}`}>
                        <div className={`mr-1 w-2 self-stretch rounded-l-sm bg-(--event-color)`} />
                        <span className="text-primary truncate py-0.5 text-xs">
                            {formatDateTime(event.start)} {event.summary}
                        </span>
                    </div>
                );
            })}
            {remainingCount > 0 && <div className="text-secondary ml-2 truncate text-xs">+{remainingCount}</div>}
        </div>
    );
}
