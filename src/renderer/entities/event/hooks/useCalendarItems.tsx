import { CalendarEvent, HolidayEvent } from '@/shared/types/EventType';
import { useMemo } from 'react';
import { useEvents, useHolidayEvents } from './useEvent';

export function useCalendarItems() {
  const { data: eventData } = useEvents();
  const { data: holidayData } = useHolidayEvents();

  const eventItems: CalendarEvent[] = (eventData?.items ?? []).map((event) => {
    const isCompleted = event.extendedProperties?.private?.isCompleted === 'true' ? 'true' : 'false';
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
        end: { end: event.end.dateTime, timeZone: event.end.timeZone ?? '' }
      };
    }

    return {
      ...common,
      category: 'allDay',
      start: { date: event.start?.date ?? '' },
      end: { date: event.end?.date ?? '' }
    };
  });

  const holidayItems: HolidayEvent[] = (holidayData?.items ?? []).map((event) => ({
    ...event,
    category: 'holiday',
    colorId: '10',
    start: { date: event.start?.date ?? '' },
    end: { date: event.end?.date ?? '' },
    extendedProperties: {
      private: { isCompleted: 'false' }
    }
  }));

  const sortedItems = useMemo(() => {
    const merged: CalendarEvent[] = [...holidayItems, ...eventItems];

    return merged.sort((a, b) => {
      const startA = a.category === 'time' ? a.start.dateTime : a.start.date;
      const startB = b.category === 'time' ? b.start.dateTime : b.start.date;
      return startA.localeCompare(startB);
    });
  }, [eventItems, holidayItems]);

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};

    sortedItems.forEach((event) => {
      const dateString = event.category === 'time' ? event.start.dateTime : event.start.date;
      if (!dateString) {
        return;
      }

      const dateKey = dateString.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  }, [sortedItems]);

  return { items: sortedItems, eventsByDate };
}
