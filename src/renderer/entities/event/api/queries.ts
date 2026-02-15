import { queryOptions } from '@tanstack/react-query';
import { eventApi } from '.';

export const eventKeys = {
  events: ['googleCalendarEvents'] as const,
  holidays: ['googleCalendarHolidays'] as const
};

export const eventOptions = {
  events: (accessToken: string) =>
    queryOptions({
      queryKey: eventKeys.events,
      queryFn: () => eventApi.getEvents(accessToken)
    }),
  holidays: (accessToken: string) =>
    queryOptions({
      queryKey: eventKeys.holidays,
      queryFn: () => eventApi.getHolidays(accessToken)
    })
};
