import dayjs from 'dayjs';

export function getDDay(targetDate: Date | string): string {
  const today = dayjs().startOf('day');
  const target = dayjs(targetDate).startOf('day');

  const diffDays = target.diff(today, 'day');

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays > 0) {
    return `D-${diffDays}`;
  }
  return `D+${Math.abs(diffDays)}`;
}
