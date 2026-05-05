import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

export type DateProps = {
  days: Date[];
  year: number;
  month: number;
  displayMonth: number;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
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

  const handlePrevMonth = () => setViewDate(viewDate.subtract(1, 'month'));
  const handleNextMonth = () => setViewDate(viewDate.add(1, 'month'));

  return {
    days,
    year,
    month,
    displayMonth,
    handlePrevMonth,
    handleNextMonth
  };
}
