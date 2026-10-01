import { CalendarEvent } from '@/shared/types/EventType';
import { useMemo } from 'react';
import { useEvents, useHolidayEvents, useSubscribedEvents } from './useEvent';
import { useHoliday } from '../context/HolidayContext';
import { useColorFilter } from '../context/ColorFilterContext';

export function useCalendarItems() {
  const { data: eventData } = useEvents();
  const subscribedEvents = useSubscribedEvents();
  const { data: holidayData } = useHolidayEvents();
  const { showHoliday } = useHoliday();
  const { filteredColors } = useColorFilter();

  const items = useMemo<CalendarEvent[]>(() => {
    const events = eventData?.items ?? [];
    // 초대받은 일정은 primary와 다른 캘린더에 같은 id로 둘 다 올 수 있어 primary 쪽만 남긴다
    const primaryIds = new Set(events.map((e) => e.id));
    const subscribed = subscribedEvents.flatMap(({ colorId, items }) => items.filter((event) => !primaryIds.has(event.id)).map((event) => ({ ...event, colorId, readOnly: true })));
    const holidays = showHoliday ? (holidayData?.items ?? []).map((event) => ({ ...event, colorId: '10', readOnly: true })) : [];

    const all = [...holidays, ...events, ...subscribed].map((event): CalendarEvent => {
      const common = { ...event, colorId: event.colorId ?? '1' };
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
    const filtered = filteredColors.size > 0 ? all.filter((e) => filteredColors.has(e.colorId)) : all;

    return filtered.sort((a, b) => {
      const sa = a.category === 'time' ? a.start.dateTime : a.start.date;
      const sb = b.category === 'time' ? b.start.dateTime : b.start.date;
      return sa.localeCompare(sb);
    });
  }, [eventData, subscribedEvents, holidayData, showHoliday, filteredColors]);

  return { items };
}
