import dayjs from 'dayjs';

const RRULE_MAP = {
  DAILY: 'RRULE:FREQ=DAILY;INTERVAL=1',
  WEEKLY: 'RRULE:FREQ=WEEKLY;INTERVAL=1',
  MONTHLY: 'RRULE:FREQ=MONTHLY;INTERVAL=1',
  YEARLY: 'RRULE:FREQ=YEARLY;INTERVAL=1'
} as const;

interface EventBodyParams {
  date: Date;
  start: string;
  end: string;
  summary: string;
  colorId: string;
  allDay: boolean;
  recurrence?: string | null;
}

export function createEventBody({ date, start, end, summary, allDay, colorId = '1', recurrence }: EventBodyParams) {
  const baseDate = dayjs(date);
  const recurrenceRule = recurrence ? [RRULE_MAP[recurrence as keyof typeof RRULE_MAP]] : undefined;

  if (allDay) {
    return {
      summary,
      colorId,
      start: { date: baseDate.format('YYYY-MM-DD') },
      end: { date: baseDate.add(1, 'day').format('YYYY-MM-DD') },
      ...(recurrenceRule && { recurrence: recurrenceRule })
    };
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const startDateTime = baseDate.hour(startHour).minute(startMin).second(0);
  const endDateTime = baseDate.hour(endHour).minute(endMin).second(0);

  return {
    summary,
    colorId,
    start: { dateTime: startDateTime.format(), timeZone },
    end: { dateTime: endDateTime.format(), timeZone },
    ...(recurrenceRule && { recurrence: recurrenceRule })
  };
}
