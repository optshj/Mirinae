import { queryOptions } from '@tanstack/react-query';
import { eventApi } from '.';

const TEN_MINUTES_IN_MS = 10 * 60 * 1000; // 10 minutes

export const eventKeys = {
  events: ['googleCalendarEvents'] as const,
  holidays: ['googleCalendarHolidays'] as const,
  calendarList: ['googleCalendarList'] as const,
  // events와 prefix를 분리해 primary mutation의 invalidate가 다른 캘린더까지 번지지 않게 한다
  calendarEvents: (calendarId: string) => ['googleCalendarSubscribedEvents', calendarId] as const
};

export const eventOptions = {
  events: () =>
    queryOptions({
      queryKey: eventKeys.events,
      queryFn: () => eventApi.getEvents(),
      staleTime: TEN_MINUTES_IN_MS,
      refetchInterval: TEN_MINUTES_IN_MS,
      refetchIntervalInBackground: true
    }),

  calendarEvents: (calendarId: string) =>
    queryOptions({
      queryKey: eventKeys.calendarEvents(calendarId),
      queryFn: () => eventApi.getEvents(calendarId),
      staleTime: TEN_MINUTES_IN_MS,
      refetchInterval: TEN_MINUTES_IN_MS,
      refetchIntervalInBackground: true
    }),

  calendarList: () =>
    queryOptions({
      queryKey: eventKeys.calendarList,
      queryFn: () => eventApi.getCalendarList(),
      staleTime: Infinity
    }),

  holidays: () =>
    queryOptions({
      queryKey: eventKeys.holidays,
      queryFn: () => eventApi.getHolidays()
    })
};
