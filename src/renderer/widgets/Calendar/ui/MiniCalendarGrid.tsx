import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useCalendarItems, useMaxLanes, getEventRange } from '@/entities/event';
import { DateProps } from '@/shared/hooks/useDate';

interface DayEvent {
  id: string;
  colorId: string;
  summary: string;
}

export function MiniCalendarGrid({ days, month }: Pick<DateProps, 'days' | 'month'>) {
  const { items } = useCalendarItems();
  const { maxLanes } = useMaxLanes();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const cellRefs = useRef(new Map<string, HTMLDivElement>());

  const eventsByDate = useMemo(() => {
    const map: Record<string, DayEvent[]> = {};
    items.forEach((event) => {
      const [start, end] = getEventRange(event);
      let cur = dayjs(start);
      const last = dayjs(end);
      while (cur.isSameOrBefore(last, 'day')) {
        const key = cur.format('YYYY-MM-DD');
        (map[key] ??= []).push({ id: event.id, colorId: event.colorId, summary: event.summary });
        cur = cur.add(1, 'day');
      }
    });
    return map;
  }, [items]);

  // 미니뷰는 창이 작아 hover만으로 일정을 훑어봐야 함 - 실제 포워딩된 마우스 이동을
  // window pointermove로 직접 추적한다 (Tooltip과 동일 패턴; onMouseEnter/Leave는 신뢰 불가).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      let found: string | null = null;
      for (const [key, el] of cellRefs.current) {
        const rect = el.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          found = key;
          break;
        }
      }
      setHoveredKey(found);
    };
    const hide = () => setHoveredKey(null);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('blur', hide);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', hide);
    };
  }, []);

  return (
    <div className="bg-primary flex flex-col overflow-hidden rounded-b-lg">
      <div className="border-primary grid grid-cols-7 border-b pb-2.5 text-center text-sm leading-none font-medium">
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

      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((date, i) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = dayjs(date).isSame(dayjs(), 'day');
          const dateKey = dayjs(date).format('YYYY-MM-DD');
          const dayEvents = eventsByDate[dateKey] ?? [];
          const row = Math.floor(i / 7);
          const col = i % 7;

          return (
            <div
              key={dateKey}
              data-date={dateKey}
              ref={(el) => {
                if (el) cellRefs.current.set(dateKey, el);
                else cellRefs.current.delete(dateKey);
              }}
              className={`relative flex h-14 flex-col items-center justify-center gap-1.5 rounded-md transition-colors ${hoveredKey === dateKey ? 'bg-main-color/20' : ''}`}
            >
              <div className={`-mt-1.5 flex flex-col items-center gap-1.5 ${!isCurrentMonth && 'opacity-40'}`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-md text-sm tracking-tighter ${isToday ? 'bg-red-400 text-white' : 'text-primary'}`}>{date.getDate()}</div>
                <div className="flex h-2 items-center gap-1">
                  {dayEvents.slice(0, maxLanes).map((event, i) => (
                    <span key={i} className={`h-2 w-2 shrink-0 rounded-full event-color-${event.colorId} bg-(--event-color)`} />
                  ))}
                  {dayEvents.length > maxLanes && <span className="text-secondary flex h-2 w-2 shrink-0 items-center justify-center text-[10px] leading-none">+</span>}
                </div>
              </div>

              {hoveredKey === dateKey && <MiniDayPopover date={date} events={dayEvents} side={row === 0 ? 'bottom' : 'top'} align={col === 0 ? 'start' : col === 6 ? 'end' : 'center'} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MiniDayPopoverProps {
  date: Date;
  events: DayEvent[];
  side: 'top' | 'bottom';
  align: 'start' | 'center' | 'end';
}
function MiniDayPopover({ date, events, side, align }: MiniDayPopoverProps) {
  const visible = events.slice(0, 6);
  const hidden = events.length - visible.length;

  const sideClass = side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1';
  const alignClass = align === 'start' ? 'left-2' : align === 'end' ? 'right-2' : 'left-1/2 -translate-x-1/2';

  return (
    <div
      role="tooltip"
      className={`bg-primary border-primary animate-in fade-in-0 zoom-in-95 pointer-events-none absolute z-50 w-max max-w-44 rounded-md border px-2 py-1.5 text-xs shadow-lg duration-100 ${sideClass} ${alignClass}`}
    >
      <div className="text-primary mb-1 text-[11px] font-semibold">
        {date.getMonth() + 1}월 {date.getDate()}일
      </div>
      {events.length === 0 ? (
        <div className="text-secondary">일정 없음</div>
      ) : (
        <ul className="flex flex-col gap-1">
          {visible.map((event) => (
            <li key={event.id} className="text-primary flex items-center gap-1.5">
              <span className={`h-3 w-1 shrink-0 rounded-full event-color-${event.colorId} bg-(--event-color)`} />
              <span className="truncate">{event.summary}</span>
            </li>
          ))}
          {hidden > 0 && <li className="text-secondary">+{hidden}개</li>}
        </ul>
      )}
    </div>
  );
}
