import { CalendarEvent } from '@/shared/types/EventType';

// 8:00 AM 형식으로 시간 포맷팅
function formatDateTime(date: { date?: string; dateTime?: string; timeZone?: string }) {
    if (!date.dateTime) {
        return null;
    }
    const d = new Date(date.dateTime);
    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: date.timeZone || 'UTC'
    });

    return formatter.format(d);
}

export function EventList({ items }: { items: CalendarEvent[] }) {
    return (
        <>
            {items.slice(0, 4).map((event, i) => (
                <div
                    key={i}
                    className={`mx-1 mt-1 line-clamp-1 flex items-center truncate overflow-hidden rounded-sm pr-1 text-sm dark:saturate-70 event-color-${event.colorId} bg-[var(--event-color)]/20 ${event.extendedProperties.private.isCompleted ? 'opacity-50' : ''}`}
                >
                    <div className={`mr-1 w-2 shrink-0 self-stretch rounded-l-sm event-color-${event.colorId} bg-[var(--event-color)]`} />
                    <span className="text-primary truncate py-0.5 text-xs">
                        {formatDateTime(event.start)} {event.summary}
                    </span>
                </div>
            ))}
        </>
    );
}
