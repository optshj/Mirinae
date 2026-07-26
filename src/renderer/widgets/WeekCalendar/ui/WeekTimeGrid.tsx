import dayjs from 'dayjs';
import { ChevronUp, ChevronDown } from 'lucide-react';

import { CalendarEvent } from '@/shared/types/EventType';
import { WeekDayColumn } from './WeekDayColumn';
import { HOUR_HEIGHT_PX, DEFAULT_SCROLL_HOUR } from '../lib/constants';
import { useHourScroll } from '../lib/useHourScroll';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface WeekTimeGridProps {
  weekDays: Date[];
  items: CalendarEvent[];
  onOpenDay: (date: Date, hour: number) => void;
}

export function WeekTimeGrid({ weekDays, items, onOpenDay }: WeekTimeGridProps) {
  const contentHeight = HOUR_HEIGHT_PX * 24;
  const { viewportRef, offset, maxOffset, stepUp, stepDown, handleWheel } = useHourScroll(contentHeight, HOUR_HEIGHT_PX, HOUR_HEIGHT_PX * DEFAULT_SCROLL_HOUR);

  return (
    <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-hidden" onWheel={handleWheel}>
      <div className="absolute inset-x-0 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]" style={{ top: -offset }}>
        <div className="relative" style={{ height: contentHeight }}>
          {HOURS.map(
            (hour) =>
              hour > 0 && (
                <div key={hour} className="text-secondary absolute right-2 -translate-y-1/2 text-[11px]" style={{ top: hour * HOUR_HEIGHT_PX }}>
                  {dayjs().hour(hour).minute(0).locale('en').format('h A')}
                </div>
              )
          )}
        </div>

        {weekDays.map((date) => (
          <WeekDayColumn key={dayjs(date).format('YYYY-MM-DD')} date={date} items={items} onOpenDay={onOpenDay} />
        ))}
      </div>

      {offset > 0 && (
        <button
          type="button"
          aria-label="이전 시간대"
          onClick={stepUp}
          className="bg-primary text-primary border-primary absolute top-1 left-1/2 -translate-x-1/2 rounded-full border p-1 shadow-md hover:brightness-95"
        >
          <ChevronUp size={16} strokeWidth={2} />
        </button>
      )}
      {offset < maxOffset && (
        <button
          type="button"
          aria-label="다음 시간대"
          onClick={stepDown}
          className="bg-primary text-primary border-primary absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full border p-1 shadow-md hover:brightness-95"
        >
          <ChevronDown size={16} strokeWidth={2} />
        </button>
      )}

      {maxOffset > 0 &&
        (() => {
          const thumbPercent = Math.max(8, (100 * (contentHeight - maxOffset)) / contentHeight);
          const topPercent = thumbPercent / 2 + (100 - thumbPercent) * (offset / maxOffset);
          return (
            <div className="bg-background-primary pointer-events-none absolute top-1 right-1 bottom-1 w-1 rounded-full">
              <div className="absolute w-full rounded-full bg-(--color-text-secondary)/40" style={{ height: `${thumbPercent}%`, top: `${topPercent}%`, transform: 'translateY(-50%)' }} />
            </div>
          );
        })()}
    </div>
  );
}
