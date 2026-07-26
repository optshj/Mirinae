import dayjs from 'dayjs';
import { useMemo } from 'react';

import { EventList, buildWeekSegments, EventSegment } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';

interface WeekAllDayStripProps {
  weekDays: Date[];
  items: CalendarEvent[];
  maxLanes: number;
  onPickDate: (date: Date) => void;
  onEventPointerDown: (e: React.PointerEvent, seg: EventSegment) => void;
  draggingEventId: string | null;
  previewRange: { start: string; end: string } | null;
}

export function WeekAllDayStrip({ weekDays, items, maxLanes, onPickDate, onEventPointerDown, draggingEventId, previewRange }: WeekAllDayStripProps) {
  const weekStart = dayjs(weekDays[0]).format('YYYY-MM-DD');
  const weekEnd = dayjs(weekDays[6]).format('YYYY-MM-DD');

  // 시간 단위 이벤트는 아래 시간 그리드에서 별도로 렌더링되므로, 종일 스트립에는 allDay/holiday만 표시
  const stripItems = useMemo(() => items.filter((item) => item.category !== 'time'), [items]);
  const { visible, overflowByDate } = useMemo(() => buildWeekSegments(stripItems, weekStart, weekEnd, maxLanes), [stripItems, weekStart, weekEnd, maxLanes]);

  return (
    <div className="border-primary relative grid shrink-0 grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b" style={{ minHeight: `${maxLanes * 20 + 12}px` }}>
      <div className="text-secondary flex items-center justify-end pr-2 text-[11px] whitespace-nowrap">종일</div>
      {weekDays.map((date) => {
        const dateKey = dayjs(date).format('YYYY-MM-DD');
        const more = overflowByDate[dateKey] ?? 0;
        const isDropPreview = previewRange !== null && dateKey >= previewRange.start && dateKey <= previewRange.end;

        return (
          <div key={dateKey} data-date={dateKey} className={`border-primary flex justify-end border-l px-1 pt-0.5 ${isDropPreview ? 'bg-main-color/10' : ''}`} onDoubleClick={() => onPickDate(date)}>
            {more > 0 && <span className="text-secondary text-[10px] font-normal whitespace-nowrap">+{more}개 일정</span>}
          </div>
        );
      })}

      <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-14 grid grid-cols-7 gap-y-1" style={{ gridTemplateRows: `repeat(${maxLanes}, minmax(0, 20px))` }}>
        {visible.map((seg) => (
          <EventList
            key={seg.event.id + seg.start}
            seg={seg}
            weekStart={weekStart}
            onDoubleClick={onPickDate}
            onPointerDown={onEventPointerDown}
            dimmed={seg.event.id === draggingEventId}
            interactive={draggingEventId === null}
          />
        ))}
      </div>
    </div>
  );
}
