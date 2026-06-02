import { CalendarEvent, HolidayEvent } from '@/shared/types/EventType';
import { useMemo } from 'react';
import { useEvents, useHolidayEvents } from './useEvent';
import { useHoliday } from '../context/HolidayContext';

export function useCalendarItems() {
  const { data: eventData } = useEvents();
  const { data: holidayData } = useHolidayEvents();
  const { showHoliday } = useHoliday();

  const items = useMemo<CalendarEvent[]>(() => {
    const eventItems: CalendarEvent[] = (eventData?.items ?? []).map((event) => {
      const isCompleted = event.extendedProperties?.private?.isCompleted === 'true';
      const common = {
        ...event,
        colorId: event.colorId ?? '1',
        extendedProperties: { private: { isCompleted } }
      };

      if (event.start?.dateTime && event.end?.dateTime) {
        return {
          ...common,
          category: 'time',
          start: { dateTime: event.start.dateTime, timeZone: event.start.timeZone ?? '' },
          end: { dateTime: event.end.dateTime, timeZone: event.end.timeZone ?? '' }
        };
      }
      return {
        ...common,
        category: 'allDay',
        start: { date: event.start?.date ?? '' },
        end: { date: event.end?.date ?? '' }
      };
    });

    const holidayItems: HolidayEvent[] = showHoliday
      ? (holidayData?.items ?? []).map((event) => ({
          ...event,
          category: 'holiday',
          colorId: '10',
          start: { date: event.start?.date ?? '' },
          end: { date: event.end?.date ?? '' },
          extendedProperties: { private: { isCompleted: false } }
        }))
      : [];

    return [...holidayItems, ...eventItems].sort((a, b) => {
      const sa = a.category === 'time' ? a.start.dateTime : a.start.date;
      const sb = b.category === 'time' ? b.start.dateTime : b.start.date;
      return sa.localeCompare(sb);
    });
  }, [eventData, holidayData, showHoliday]);

  return { items };
}
