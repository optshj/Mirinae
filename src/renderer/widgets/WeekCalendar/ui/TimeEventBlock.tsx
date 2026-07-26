import { TimeSegment, formatEventTime } from '@/entities/event';
import { HOUR_HEIGHT_PX } from '../lib/constants';

interface TimeEventBlockProps {
  seg: TimeSegment;
  onDoubleClick: () => void;
}

export function TimeEventBlock({ seg, onDoubleClick }: TimeEventBlockProps) {
  const { event, startMin, endMin, isStart, col, colCount } = seg;
  const top = (startMin / 60) * HOUR_HEIGHT_PX;
  const height = ((endMin - startMin) / 60) * HOUR_HEIGHT_PX;
  const timeLabel = isStart && event.category === 'time' ? formatEventTime(event.start) : null;

  return (
    <div
      className={`event-color-${event.colorId} text-primary absolute overflow-hidden rounded-sm border-l-2 border-(--event-color) bg-(--event-color)/20 px-1.5 py-0.5 text-[11px] leading-tight dark:saturate-70`}
      style={{
        top,
        height: Math.max(height, 1),
        left: `calc(${(col / colCount) * 100}% + 2px)`,
        width: `calc(${(1 / colCount) * 100}% - 4px)`
      }}
      data-event={event.summary}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      {timeLabel && <span className="text-secondary mr-1">{timeLabel}</span>}
      <span className="truncate">{event.summary}</span>
    </div>
  );
}
