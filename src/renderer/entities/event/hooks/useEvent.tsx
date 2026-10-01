import { useCallback, useMemo } from 'react';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { eventOptions } from '../api/queries';
import { HOLIDAY_CALENDAR_ID } from '../api';
import { useLogin } from '@/shared/hooks/useLogin';
import { COLORPALLETTE } from '@/shared/const/color';
import { Events } from '@/shared/types/EventType';

export const useEvents = () => {
  const { isAuthenticated } = useLogin();
  return useQuery({
    ...eventOptions.events(),
    enabled: isAuthenticated
  });
};

export const useHolidayEvents = () => {
  const { isAuthenticated } = useLogin();
  return useQuery({
    ...eventOptions.holidays(),
    enabled: isAuthenticated
  });
};

export const useCalendarList = () => {
  const { isAuthenticated } = useLogin();
  return useQuery({
    ...eventOptions.calendarList(),
    enabled: isAuthenticated
  });
};

/** Google 캘린더에서 체크된(selected) 다른 캘린더의 일정. 대한민국 공휴일은 useHolidayEvents가 따로 가져온다. */
export const useSubscribedEvents = () => {
  const { data } = useCalendarList();
  const calendars = useMemo(
    () =>
      (data?.items ?? [])
        .filter((cal) => !cal.primary && cal.selected && cal.id !== HOLIDAY_CALENDAR_ID)
        .map((cal) => ({ id: cal.id, colorId: COLORPALLETTE[(Number(cal.colorId || 1) - 1) % COLORPALLETTE.length] })),
    [data]
  );
  const combine = useCallback((results: Array<UseQueryResult<{ items: Events[] }>>) => results.map((result, i) => ({ colorId: calendars[i].colorId, items: result.data?.items ?? [] })), [calendars]);
  return useQueries({ queries: calendars.map((cal) => eventOptions.calendarEvents(cal.id)), combine });
};
