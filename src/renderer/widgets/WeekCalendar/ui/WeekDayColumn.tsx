import dayjs from 'dayjs';

import { buildDayTimeSegments } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';
import { TimeEventBlock } from './TimeEventBlock';
import { HOUR_HEIGHT_PX } from '../lib/constants';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface WeekDayColumnProps {
  date: Date;
  items: CalendarEvent[];
  onOpenDay: (date: Date, hour: number) => void;
}

export function WeekDayColumn({ date, items, onOpenDay }: WeekDayColumnProps) {
  const dateKey = dayjs(date).format('YYYY-MM-DD');
  const isToday = dayjs(date).isSame(dayjs(), 'day');
  const segments = buildDayTimeSegments(items, dateKey);

  return (
    <div className={`border-primary relative border-l ${isToday ? 'bg-main-color/5' : ''}`} style={{ height: HOUR_HEIGHT_PX * 24 }} data-date={dateKey}>
      {HOURS.map((hour) => (
        <div key={hour} className="border-primary absolute inset-x-0 border-t" style={{ top: hour * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }} onDoubleClick={() => onOpenDay(date, hour)} />
      ))}

      {segments.map((seg) => (
        <TimeEventBlock key={seg.event.id + seg.startMin} seg={seg} onDoubleClick={() => onOpenDay(date, Math.floor(seg.startMin / 60))} />
      ))}
    </div>
  );
}
