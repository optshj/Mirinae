import { useCallback, useMemo } from 'react';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { eventOptions } from '../api/queries';
import { HOLIDAY_CALENDAR_ID } from '../api';
import { useLogin } from '@/shared/hooks/useLogin';
import { COLORPALLETTE } from '@/shared/const/color';
import { Events } from '@/shared/types/EventType';
import { usePreference } from '@/shared/lib/preferences';

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

/** primary·대한민국 공휴일(useHolidayEvents가 따로 가져옴)을 뺀 구독/공유 캘린더. 표시 여부는 미리내에서 고른 목록 → 고른 적 없으면 Google의 selected */
export const useSubscribedCalendars = () => {
  const { data } = useCalendarList();
  const [visibleIds] = usePreference('visibleCalendars');
  return useMemo(
    () =>
      (data?.items ?? [])
        .filter((cal) => !cal.primary && cal.id !== HOLIDAY_CALENDAR_ID)
        .map((cal) => ({
          id: cal.id,
          name: cal.summaryOverride ?? cal.summary,
          // 캘린더 colorId(1~24)를 이벤트 팔레트(11색)에 접는다
          colorId: COLORPALLETTE[(Number(cal.colorId || 1) - 1) % COLORPALLETTE.length],
          visible: visibleIds ? visibleIds.includes(cal.id) : Boolean(cal.selected)
        })),
    [data, visibleIds]
  );
};

export const useSubscribedEvents = () => {
  const all = useSubscribedCalendars();
  const calendars = useMemo(() => all.filter((cal) => cal.visible), [all]);
  // combine 참조가 안정적이어야 결과가 메모이즈돼 useCalendarItems의 useMemo가 매 렌더 다시 돌지 않는다
  const combine = useCallback((results: Array<UseQueryResult<{ items: Events[] }>>) => results.map((result, i) => ({ colorId: calendars[i].colorId, items: result.data?.items ?? [] })), [calendars]);
  return useQueries({ queries: calendars.map((cal) => eventOptions.calendarEvents(cal.id)), combine });
};
