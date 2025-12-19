import dayjs from 'dayjs';
import { CalendarEvent, isHolidayEvent } from '@/shared/types/EventType';

function formatDateTime(dateField: { date?: string; dateTime?: string; timeZone?: string }) {
    if (!dateField.dateTime) {
        return null;
    }

    const d = dayjs(dateField.dateTime).locale('en');
    const formatStr = d.minute() === 0 ? 'h A' : 'h:mm A';

    return d.format(formatStr);
}

export function EventList({ items }: { items: CalendarEvent[] }) {
    return (
        <>
            {items.slice(0, 4).map((event, i) => {
                const isCompleted = event.extendedProperties?.private?.isCompleted === 'true';
                const isHoliday = isHolidayEvent(event);

                const statusClasses = [isCompleted ? 'opacity-50' : 'opacity-100', isHoliday ? '[html:not(.show-holiday)_&]:hidden' : ''].join(' ');

                return (
                    <div
                        key={event.id || i}
                        className={`mx-1 mt-1 line-clamp-1 flex items-center truncate overflow-hidden rounded-sm pr-1 text-sm dark:saturate-70 event-color-${event.colorId} bg-(--event-color)/20 ${statusClasses}`}
                    >
                        <div className={`mr-1 w-2 shrink-0 self-stretch rounded-l-sm event-color-${event.colorId} bg-(--event-color)`} />
                        <span className="text-primary truncate py-0.5 text-xs">
                            {formatDateTime(event.start)} {event.summary}
                        </span>
                    </div>
                );
            })}
        </>
    );
}
