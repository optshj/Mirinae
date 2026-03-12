import { queryOptions } from '@tanstack/react-query';
import { eventApi } from '.';

const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000; // 2 hours

export const eventKeys = {
  events: ['googleCalendarEvents'] as const,
  holidays: ['googleCalendarHolidays'] as const
};

export const eventOptions = {
  events: (accessToken: string) =>
    queryOptions({
      queryKey: eventKeys.events,
      queryFn: () => eventApi.getEvents(accessToken),
      staleTime: TWO_HOURS_IN_MS,
      refetchInterval: TWO_HOURS_IN_MS,
      refetchIntervalInBackground: true
    }),

  holidays: (accessToken: string) =>
    queryOptions({
      queryKey: eventKeys.holidays,
      queryFn: () => eventApi.getHolidays(accessToken),
      staleTime: TWO_HOURS_IN_MS,
      refetchInterval: TWO_HOURS_IN_MS
    })
};
