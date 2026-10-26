import dayjs from 'dayjs';
import { useState, useMemo, useLayoutEffect, useRef } from 'react';

import { ScheduleModal } from './ScheduleModal';
import { EventList, useCalendarItems, buildMonthSegments, buildHolidays, useHolidayEvents, useHoliday, EventSegment } from '@/entities/event';
import { useEventDrag, DragGhost } from '@/features/event-drag';

import { Dialog } from '@/shared/ui/dialog';
import { DateProps } from '@/shared/hooks/useDate';
import { cn } from '@/shared/lib/utils';

const DATE_HEADER_PX = 32;
const LANE_PX = 20;
const LANE_GAP_PX = 4;

type Holidays = ReturnType<typeof buildHolidays>;
const NO_HOLIDAYS: Holidays = { dates: new Set(), names: {} };

export function CalendarGrid({ days, month }: Pick<DateProps, 'days' | 'month'>) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [maxLanes, setMaxLanes] = useState(1);
  const weeksRef = useRef<HTMLDivElement>(null);

  const { items } = useCalendarItems();
  const { drag, previewRange, ghostRef, posRef, startDrag } = useEventDrag();
  const { data: holidayData } = useHolidayEvents();
  const { showHoliday } = useHoliday();

  // 창 높이(크기 조절, '달력만' 전환)에 맞춰 들어가는 만큼 줄 수를 정한다. 6개 행은 높이가 같아서 컨테이너만 재면 된다.
  useLayoutEffect(() => {
    const el = weeksRef.current;
    if (!el) return;
    const measure = () => {
      const rowHeight = el.clientHeight / 6;
      setMaxLanes(Math.max(1, Math.floor((rowHeight - DATE_HEADER_PX + LANE_GAP_PX) / (LANE_PX + LANE_GAP_PX))));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const holidays = useMemo(() => (showHoliday ? buildHolidays(holidayData?.items ?? []) : NO_HOLIDAYS), [holidayData, showHoliday]);
  const laneItems = useMemo(() => {
    const holidayIds = new Set((holidayData?.items ?? []).map((event) => event.id));
    return items.filter((event) => !holidayIds.has(event.id));
  }, [items, holidayData]);

  const weekArray = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  }, [days]);

  const weekRanges = useMemo(() => weekArray.map((week) => ({ start: dayjs(week[0]).format('YYYY-MM-DD'), end: dayjs(week[6]).format('YYYY-MM-DD') })), [weekArray]);

  // 주(week)마다 전체 items를 다시 훑지 않고 한 번에 계산 - 공휴일 표시 토글처럼 items 레퍼런스만
  // 바뀌는 경우에도 영향 없는 주까지 매번 재계산되던 걸 줄인다.
  const monthSegments = useMemo(() => buildMonthSegments(laneItems, weekRanges, maxLanes), [laneItems, weekRanges, maxLanes]);

  return (
    <div className="bg-surface flex flex-1 flex-col overflow-hidden rounded-b-xl">
      <div className="bg-background-primary grid grid-cols-7 py-2 text-center">
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

      <div ref={weeksRef} className="grid h-[calc(100vh-20rem)] grid-rows-6 transition-all duration-300 ease-in-out [html.flip-footer_&]:h-[calc(100vh-7.5rem)] [html.resizable_&]:transition-none">
        {weekArray.map((week, weekIndex) => (
          <WeekRow
            key={weekIndex}
            week={week}
            month={month}
            visible={monthSegments[weekIndex].visible}
            overflowByDate={monthSegments[weekIndex].overflowByDate}
            maxLanes={maxLanes}
            holidays={holidays}
            onPickDate={(date) => {
              setSelectedDate(date);
              setOpen(true);
            }}
            onEventPointerDown={startDrag}
            draggingEventId={drag?.seg.event.id ?? null}
            previewRange={previewRange}
          />
        ))}

        <Dialog open={open} onOpenChange={setOpen}>
          <ScheduleModal date={selectedDate} />
        </Dialog>

        {drag && <DragGhost seg={drag.seg} ghost={drag.ghost} ghostRef={ghostRef} posRef={posRef} />}
      </div>
    </div>
  );
}

interface WeekRowProps {
  week: Date[];
  month: number;
  visible: EventSegment[];
  overflowByDate: Record<string, number>;
  maxLanes: number;
  holidays: Holidays;
  onPickDate: (date: Date) => void;
  onEventPointerDown: (e: React.PointerEvent, seg: EventSegment) => void;
  draggingEventId: string | null;
  previewRange: { start: string; end: string } | null;
}
function WeekRow({ week, month, visible, overflowByDate, maxLanes, holidays, onPickDate, onEventPointerDown, draggingEventId, previewRange }: WeekRowProps) {
  const weekStart = dayjs(week[0]).format('YYYY-MM-DD');

  return (
    <div className="border-surface relative grid grid-cols-7 border-t first:border-t-0">
      {week.map((date) => {
        const isCurrentMonth = date.getMonth() === month;
        const isToday = dayjs(date).isSame(dayjs(), 'day');
        const dateKey = dayjs(date).format('YYYY-MM-DD');
        const more = overflowByDate[dateKey] ?? 0;
        const isDropPreview = previewRange !== null && dateKey >= previewRange.start && dateKey <= previewRange.end;
        const isHoliday = holidays.dates.has(dateKey);
        const isRestDay = date.getDay() === 0 || isHoliday;
        const holidayNames = holidays.names[dateKey];

        return (
          <div
            key={dateKey}
            data-date={dateKey}
            data-hoverable={draggingEventId === null ? '' : undefined}
            className={cn('data-hovered:bg-main-color/20 flex h-full w-full flex-col overflow-hidden rounded-md transition-colors', isDropPreview && 'bg-main-color/10')}
            onDoubleClick={() => onPickDate(date)}
          >
            <div className={`grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 p-1 font-semibold ${isCurrentMonth ? 'text-primary' : 'text-secondary'}`}>
              <div className="flex min-w-0 justify-end">
                {more > 0 && (
                  <span aria-label={`일정 ${more}개 더 있음`} className="text-secondary min-w-0 truncate rounded-[5px] bg-black/5 px-1.25 text-[10px] font-medium tabular-nums dark:bg-white/10">
                    +{more}개 일정
                  </span>
                )}
              </div>
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md tracking-tighter',
                  isRestDay && (isCurrentMonth ? 'text-red-400' : 'text-red-400/50'),
                  isToday && 'bg-red-400 text-white'
                )}
              >
                {date.getDate()}
              </div>
              <span className={cn('truncate text-[10px] font-semibold', isHoliday ? (isCurrentMonth ? 'text-red-400' : 'text-red-400/50') : 'text-secondary')}>{holidayNames?.join(' · ')}</span>
            </div>

            <div className="min-h-0 flex-1" />
          </div>
        );
      })}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-7"
        style={{
          top: DATE_HEADER_PX,
          rowGap: LANE_GAP_PX,
          gridTemplateRows: `repeat(${maxLanes}, ${LANE_PX}px)`
        }}
      >
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
