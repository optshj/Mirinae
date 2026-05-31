import { queryOptions } from '@tanstack/react-query';
import { eventApi } from '.';

const TEN_MINUTES_IN_MS = 10 * 60 * 1000; // 10 minutes

export const eventKeys = {
  events: ['googleCalendarEvents'] as const,
  holidays: ['googleCalendarHolidays'] as const
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

  holidays: () =>
    queryOptions({
      queryKey: eventKeys.holidays,
      queryFn: () => eventApi.getHolidays()
    })
};
