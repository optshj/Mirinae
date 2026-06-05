import dayjs from 'dayjs';
import { EventSegment } from '../lib/eventLayout';

interface EventListProps {
  seg: EventSegment;
  weekStart: string;
  onDoubleClick: (date: Date) => void;
}
export function EventList({ seg, weekStart, onDoubleClick }: EventListProps) {
  const colStart = dayjs(seg.start).diff(weekStart, 'day');
  const span = dayjs(seg.end).diff(seg.start, 'day') + 1;

  const event = seg.event;
  const isCompleted = event.extendedProperties.private.isCompleted;
  const timeLabel = event.category === 'time' ? formatDateTime(event.start) : null;

  return (
    <div
      className={`pointer-events-auto flex max-h-5 items-center overflow-hidden text-sm md:bg-(--event-color)/20 dark:saturate-70 event-color-${event.colorId} ${seg.isStart && 'rounded-l-sm'} ${seg.isEnd && 'rounded-r-sm'} ${isCompleted ? 'opacity-50' : 'opacity-100'}`}
      style={{
        gridColumnStart: colStart + 1,
        gridColumnEnd: colStart + span + 1,
        gridRowStart: seg.lane + 1,
        marginLeft: seg.isStart ? 6 : 0,
        marginRight: seg.isEnd ? 6 : 0
      }}
      onDoubleClick={() => onDoubleClick(new Date(seg.start))}
    >
      <div className="h-2.5 w-full rounded-full bg-(--event-color) md:hidden" />

      {seg.isStart && <div className="mr-1 hidden w-2 shrink-0 self-stretch bg-(--event-color) md:inline-block" />}
      <span className="text-primary hidden truncate py-0.5 pr-1 text-xs md:block">
        {seg.isStart && (
          <>
            {timeLabel && <span className="mr-1">{timeLabel}</span>}
            {event.summary}
          </>
        )}
      </span>
    </div>
  );
}
function formatDateTime(dateField: { date?: string; dateTime?: string; timeZone?: string }) {
  if (!dateField.dateTime) return null;
  const d = dayjs(dateField.dateTime).locale('en');
  return d.format(d.minute() === 0 ? 'h A' : 'h:mm A');
}
