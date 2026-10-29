import dayjs from 'dayjs';

import { cn } from '@/shared/lib/utils';
import { EventSegment, getEventRange } from '../lib/eventLayout';

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
  const isDraggable = Boolean(onPointerDown) && !event.readOnly;
  const completed = event.extendedProperties?.private?.completed === 'true';
  const [startDate, endDate] = getEventRange(event);
  const isBar = event.category !== 'time' || startDate !== endDate;

  return (
    <div
      className={cn(
        'flex max-h-5 items-center overflow-hidden text-sm dark:saturate-70',
        isBar && 'bg-(--event-color)/12',
        `event-color-${event.colorId}`,
        interactive ? 'pointer-events-auto' : 'pointer-events-none',
        seg.isStart && 'rounded-l-sm',
        seg.isEnd && 'rounded-r-sm',
        dimmed ? 'opacity-30' : completed && isBar ? 'opacity-50' : 'opacity-100',
        isDraggable && 'cursor-grab'
      )}
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
      {seg.isStart && (
        <span className="flex min-w-0 items-center gap-1 pl-1 text-xs">
          <i className={cn('shrink-0 rounded-full bg-(--event-color)', isBar ? 'mx-0.5 h-3 w-1' : 'h-2 w-2')} />
          <span className={cn('truncate', completed ? 'text-secondary line-through' : 'text-primary')}>
            {event.category === 'time' && (
              <span className={cn('hidden tabular-nums md:inline', !completed && 'font-semibold text-zinc-500 dark:text-zinc-400')}>{dayjs(event.start.dateTime).format('HH:mm')} </span>
            )}
            {event.summary}
          </span>
        </span>
      )}
    </div>
  );
}
