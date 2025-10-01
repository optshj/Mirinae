import { formatDateTime } from '@/shared/lib/dateFunction'
import { CalendarEventWithColor } from '@/shared/types/EventType'

export function EventList({ items }: { items: CalendarEventWithColor[] }) {
    return (
        <>
            {items.slice(0, 4).map((event, i) => (
                <div
                    key={i}
                    style={{
                        background: `${event.color.background}30`
                    }}
                    className="mx-1 mt-1 line-clamp-1 flex items-center truncate overflow-hidden rounded-sm pr-1 text-sm dark:saturate-70"
                >
                    <div
                        className="mr-1 w-2 flex-shrink-0 self-stretch rounded-l-sm"
                        style={{
                            backgroundColor: event.color.background
                        }}
                    />
                    <span className="text-primary truncate py-0.5">
                        {formatDateTime(event.start)} {event.summary}
                    </span>
                </div>
            ))}
        </>
    )
}
