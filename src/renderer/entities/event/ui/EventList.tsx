import dayjs from 'dayjs';
import { EventSegment } from '../lib/eventLayout';

interface EventListProps {
  seg: EventSegment;
  weekStart: string;
  onDoubleClick: (date: Date) => void;
  onPointerDown?: (e: React.PointerEvent, seg: EventSegment) => void;
  dimmed?: boolean;
  interactive?: boolean;
}
export function EventList({ seg, weekStart, onDoubleClick, onPointerDown, dimmed = false, interactive = true }: EventListProps) {
  const colStart = dayjs(seg.start).diff(weekStart, 'day');
  const span = dayjs(seg.end).diff(seg.start, 'day') + 1;

  const event = seg.event;
  const isCompleted = event.extendedProperties.private.isCompleted;
  const timeLabel = event.category === 'time' ? formatDateTime(event.start) : null;
  const isDraggable = Boolean(onPointerDown) && event.category !== 'holiday';

  return (
    <div
      className={`${interactive ? 'pointer-events-auto' : 'pointer-events-none'} flex max-h-5 items-center overflow-hidden text-sm md:bg-(--event-color)/20 dark:saturate-70 event-color-${event.colorId} ${seg.isStart && 'rounded-l-sm'} ${seg.isEnd && 'rounded-r-sm'} ${dimmed ? 'opacity-30' : isCompleted ? 'opacity-50' : 'opacity-100'} ${isDraggable && 'cursor-grab'}`}
      style={{
        gridColumnStart: colStart + 1,
        gridColumnEnd: colStart + span + 1,
        gridRowStart: seg.lane + 1,
        marginLeft: seg.isStart ? 6 : 0,
        marginRight: seg.isEnd ? 6 : 0
      }}
      data-event={event.summary}
      onDoubleClick={() => onDoubleClick(new Date(seg.start))}
      onPointerDown={(e) => onPointerDown?.(e, seg)}
    >
      <div className="h-2.5 w-full rounded-full bg-(--event-color) md:hidden" />

      {seg.isStart && <div className="mr-0.75 hidden w-1.5 shrink-0 self-stretch bg-(--event-color) md:inline-block" />}
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
