import dayjs from 'dayjs';
import { useMemo } from 'react';

import { useCalendarItems, useMaxLanes, getEventRange } from '@/entities/event';
import { DateProps } from '@/shared/hooks/useDate';

export function MiniCalendarGrid({ days, month }: Pick<DateProps, 'days' | 'month'>) {
  const { items } = useCalendarItems();
  const { maxLanes } = useMaxLanes();

  const eventsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    items.forEach((event) => {
      const [start, end] = getEventRange(event);
      let cur = dayjs(start);
      const last = dayjs(end);
      while (cur.isSameOrBefore(last, 'day')) {
        const key = cur.format('YYYY-MM-DD');
        (map[key] ??= []).push(event.colorId);
        cur = cur.add(1, 'day');
      }
    });
    return map;
  }, [items]);

  return (
    <div className="bg-primary flex flex-col overflow-hidden rounded-b-lg">
      <div className="border-primary grid grid-cols-7 border-b py-2 text-center text-xs leading-none font-medium">
        <div className="text-red-400" aria-label="일요일">
          일
        </div>
        {['월', '화', '수', '목', '금'].map((d) => (
          <div className="text-primary" key={d}>
            {d}
          </div>
        ))}
        <div className="text-blue-400" aria-label="토요일">
          토
        </div>
      </div>

      <div className="grid grid-cols-7 grid-rows-6 py-1">
        {days.map((date) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = dayjs(date).isSame(dayjs(), 'day');
          const dateKey = dayjs(date).format('YYYY-MM-DD');
          const dayEvents = eventsByDate[dateKey] ?? [];

          return (
            <div key={dateKey} data-date={dateKey} className={`flex h-11 flex-col items-center justify-center gap-1 ${!isCurrentMonth && 'opacity-40'}`}>
              <div className={`flex h-6 w-6 items-center justify-center rounded-md text-xs leading-none ${isToday ? 'bg-red-400 text-white' : 'text-primary'}`}>{date.getDate()}</div>
              <div className="flex h-1.5 items-center gap-1">
                {dayEvents.slice(0, maxLanes).map((colorId, i) => (
                  <span key={i} className={`h-1.5 w-1.5 shrink-0 rounded-full event-color-${colorId} bg-(--event-color)`} />
                ))}
                {dayEvents.length > maxLanes && <span className="text-secondary flex h-1.5 w-1.5 shrink-0 items-center justify-center text-[9px] leading-none">+</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
