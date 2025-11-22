import { formatDateTime } from '@/shared/lib/dateFunction';
import { CalendarEvent } from '@/shared/types/EventType';

export function EventList({ items }: { items: CalendarEvent[] }) {
    return (
        <>
            {items.slice(0, 4).map((event, i) => (
                <div
                    key={i}
                    className={`mx-1 mt-1 line-clamp-1 flex items-center truncate overflow-hidden rounded-sm pr-1 text-sm dark:saturate-70 event-color-${event.colorId} bg-[var(--event-color)]/20 ${event.extendedProperties.private.isCompleted ? 'opacity-50' : ''}`}
                >
                    <div className={`mr-1 w-2 shrink-0 self-stretch rounded-l-sm event-color-${event.colorId} bg-[var(--event-color)]`} />
                    <span className="text-primary truncate py-0.5">
                        {formatDateTime(event.start)} {event.summary}
                    </span>
                </div>
            ))}
        </>
    );
}
