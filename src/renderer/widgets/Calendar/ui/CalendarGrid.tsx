import dayjs from 'dayjs';
import { useState, useMemo } from 'react';

import { ScheduleModal } from './ScheduleModal';
import { EventList, useCalendarItems, buildWeekSegments, useMaxLanes } from '@/entities/event';

import { Dialog } from '@/shared/ui/dialog';
import { DateProps } from '@/shared/hooks/useDate';
import { CalendarEvent } from '@/shared/types/EventType';

export function CalendarGrid({ days, month }: Pick<DateProps, 'days' | 'month'>) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const { items } = useCalendarItems();
  const { maxLanes } = useMaxLanes();
  console.log('CalendarGrid rendered with maxLanes:', maxLanes);

  const weekArray = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  }, [days]);

  return (
    <div className="bg-primary flex flex-1 flex-col overflow-hidden rounded-xl">
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

      <div className="grid h-[calc(100vh-20rem)] grid-rows-6 transition-all duration-300 ease-in-out [html.flip-footer_&]:h-[calc(100vh-7.5rem)] [html.resizable_&]:transition-none">
        {weekArray.map((week, weekIndex) => (
          <WeekRow
            key={weekIndex}
            week={week}
            month={month}
            items={items}
            maxLanes={maxLanes}
            onPickDate={(date) => {
              setSelectedDate(date);
              setOpen(true);
            }}
          />
        ))}

        <Dialog open={open} onOpenChange={setOpen}>
          <ScheduleModal date={selectedDate} />
        </Dialog>
      </div>
    </div>
  );
}

interface WeekRowProps {
  week: Date[];
  month: number;
  items: CalendarEvent[];
  maxLanes: number;
  onPickDate: (date: Date) => void;
}
function WeekRow({ week, month, items, maxLanes, onPickDate }: WeekRowProps) {
  const weekStart = dayjs(week[0]).format('YYYY-MM-DD');
  const weekEnd = dayjs(week[6]).format('YYYY-MM-DD');

  const { visible, overflowByDate } = useMemo(() => buildWeekSegments(items, weekStart, weekEnd, maxLanes), [items, weekStart, weekEnd, maxLanes]);

  return (
    <div className="relative grid grid-cols-7">
      {week.map((date) => {
        const isCurrentMonth = date.getMonth() === month;
        const isToday = dayjs(date).isSame(dayjs(), 'day');
        const dateKey = dayjs(date).format('YYYY-MM-DD');
        const more = overflowByDate[dateKey] ?? 0;

        return (
          <div key={dateKey} className="border-primary flex h-full w-full flex-col overflow-hidden border" onDoubleClick={() => onPickDate(date)}>
            <div className={`grid grid-cols-[1fr_auto_1fr] items-center p-1 font-semibold ${isCurrentMonth ? 'text-primary' : 'text-secondary'}`}>
              <div />
              <div className={`flex h-6 w-6 items-center justify-center rounded-full dark:saturate-70 ${isToday && 'bg-main-color text-bg-gray dark:text-[#333333]'}`}>{date.getDate()}</div>
              <div className="pl-1 text-left">{more > 0 && <span className="text-secondary text-[11px] font-normal whitespace-nowrap">+{more}개 일정</span>}</div>
            </div>
          </div>
        );
      })}

      <div
        className="absolute inset-x-0 top-8 bottom-0 grid grid-cols-7 gap-y-1"
        style={{
          gridTemplateRows: `repeat(${maxLanes}, minmax(0, 20px))`
        }}
      >
        {visible.map((seg) => (
          <EventList key={seg.event.id + seg.start} seg={seg} weekStart={weekStart} onDoubleClick={onPickDate} />
        ))}
      </div>
    </div>
  );
}
