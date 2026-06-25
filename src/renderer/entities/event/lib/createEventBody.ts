import dayjs from 'dayjs';
import { EventBodyProp } from '../types';

const RRULE_MAP = {
  DAILY: 'RRULE:FREQ=DAILY;INTERVAL=1',
  WEEKLY: 'RRULE:FREQ=WEEKLY;INTERVAL=1',
  MONTHLY: 'RRULE:FREQ=MONTHLY;INTERVAL=1',
  YEARLY: 'RRULE:FREQ=YEARLY;INTERVAL=1'
} as const;

export function createEventBody({ start, end, summary, allDay, colorId = '1', recurrence, startDate, endDate }: EventBodyProp) {
  const startDay = dayjs(startDate);
  const endDay = dayjs(endDate);
  const recurrenceRule = recurrence ? [RRULE_MAP[recurrence]] : undefined;

  if (allDay) {
    return {
      summary,
      colorId,
      start: { date: startDay.format('YYYY-MM-DD') },
      end: { date: endDay.format('YYYY-MM-DD') },
      ...(recurrenceRule && { recurrence: recurrenceRule })
    };
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const startDateTime = startDay.hour(startHour).minute(startMin).second(0);
  const endDateTime = endDay.hour(endHour).minute(endMin).second(0);
  return {
    summary,
    colorId,
    start: { dateTime: startDateTime.format(), timeZone },
    end: { dateTime: endDateTime.format(), timeZone },
    ...(recurrenceRule && { recurrence: recurrenceRule })
  };
}
