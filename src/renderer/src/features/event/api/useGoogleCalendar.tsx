import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useShowHoliday } from '@/features/event/model/ShowHolidayContext';
import { CalendarEvent, isHolidayEvent } from '@/shared/types/EventType';
import { useLogin } from '@/shared/hooks/useLogin';

const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars';
const REFETCH_INTERVAL = 1000 * 60 * 60; // 1 hour

export function useGoogleCalendar() {
    const { tokens } = useLogin();
    const { isShow } = useShowHoliday();

    const { data: events } = useQuery({
        queryKey: ['googleCalendarEvents'],
        queryFn: async () => {
            const res = await fetch(`${CALENDAR_API_URL}/primary/events?maxResults=2500`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${tokens.access_token}` }
            }).then((res) => res.json());
            return res;
        },
        select: (data) => {
            return (data.items || []).map((event: CalendarEvent) => ({
                ...event,
                colorId: event.colorId ?? '1',
                extendedProperties: {
                    ...(event.extendedProperties || {}),
                    private: {
                        ...(event.extendedProperties?.private || {}),
                        isCompleted: event.extendedProperties?.private?.isCompleted ?? ''
                    }
                }
            }));
        },
        enabled: Boolean(tokens.access_token),
        refetchInterval: REFETCH_INTERVAL
    });

    const { data: holidayEvents } = useQuery({
        queryKey: ['googleCalendarHolidays'],
        queryFn: async () => {
            const res = await fetch(`${CALENDAR_API_URL}/ko.south_korea%23holiday%40group.v.calendar.google.com/events?maxResults=2500`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${tokens.access_token}` }
            }).then((res) => res.json());
            return res;
        },
        select: (data) => {
            return (data.items || [])
                .filter((event: CalendarEvent) => isHolidayEvent(event))
                .map((event: CalendarEvent) => ({
                    ...event,
                    colorId: '10',
                    extendedProperties: {
                        private: { isCompleted: false }
                    }
                }));
        },
        enabled: Boolean(tokens.access_token)
    });

    const mergedEvents = isShow ? [...(holidayEvents ?? []), ...(events ?? [])] : (events ?? []);

    const sortedEventsOrderByDate = useMemo(() => {
        return [...mergedEvents].sort((a, b) => {
            const startA = a.start.dateTime ?? a.start.date;
            const startB = b.start.dateTime ?? b.start.date;
            return startA.localeCompare(startB);
        });
    }, [mergedEvents]);

    return {
        items: sortedEventsOrderByDate
    };
}
