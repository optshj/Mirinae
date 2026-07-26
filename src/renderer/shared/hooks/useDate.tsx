import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

export type ViewMode = 'month' | 'week';

export type DateProps = {
  days: Date[];
  weekDays: Date[];
  year: number;
  month: number;
  displayMonth: number;
  weekRangeLabel: string;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handlePrevWeek: () => void;
  handleNextWeek: () => void;
};

export function useDate() {
  const [viewDate, setViewDate] = useState(dayjs());

  const year = viewDate.year();
  const month = viewDate.month();
  const displayMonth = viewDate.month() + 1;

  const days = useMemo(() => {
    const startDay = viewDate.startOf('month').startOf('week');
    return Array.from({ length: 42 }, (_, i) => startDay.add(i, 'day').toDate());
  }, [viewDate]);

  const weekDays = useMemo(() => {
    const startDay = viewDate.startOf('week');
    return Array.from({ length: 7 }, (_, i) => startDay.add(i, 'day').toDate());
  }, [viewDate]);

  const weekRangeLabel = useMemo(() => {
    const start = dayjs(weekDays[0]);
    const end = dayjs(weekDays[6]);
    if (start.month() === end.month()) {
      return `${start.month() + 1}월 ${start.date()}일 - ${end.date()}일`;
    }
    return `${start.month() + 1}월 ${start.date()}일 - ${end.month() + 1}월 ${end.date()}일`;
  }, [weekDays]);

  const handlePrevMonth = () => setViewDate(viewDate.subtract(1, 'month'));
  const handleNextMonth = () => setViewDate(viewDate.add(1, 'month'));
  const handlePrevWeek = () => setViewDate(viewDate.subtract(1, 'week'));
  const handleNextWeek = () => setViewDate(viewDate.add(1, 'week'));

  return {
    days,
    weekDays,
    year,
    month,
    displayMonth,
    weekRangeLabel,
    handlePrevMonth,
    handleNextMonth,
    handlePrevWeek,
    handleNextWeek
  };
}
