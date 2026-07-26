import dayjs from 'dayjs';

export function formatEventTime(dateField: { date?: string; dateTime?: string; timeZone?: string }) {
  if (!dateField.dateTime) return null;
  const d = dayjs(dateField.dateTime).locale('en');
  return d.format(d.minute() === 0 ? 'h A' : 'h:mm A');
}
