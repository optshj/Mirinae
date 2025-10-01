import { useQuery } from '@tanstack/react-query'

import { getColorById } from '@/features/event/lib/getColor'
import { useShowHoliday } from '@/features/event/model/ShowHolidayContext'

import { CalendarEventWithColor, isHolidayEvent } from '@/shared/types/EventType'
import { useLogin } from '@/shared/hooks/useLogin'

/**
 * Google Calendar API를 사용하여 캘린더 이벤트를 가져오는 훅입니다.
 * 공휴일 목록과 이벤트 목록을 가져옵니다.
 * @returns {Object} - 캘린더 이벤트 목록과 공휴일 목록
 */
export function useGoogleCalendar() {
    const { tokens } = useLogin()
    const { isShow } = useShowHoliday()
    const { data: items } = useQuery({
        queryKey: ['googleCalendarEvents'],
        queryFn: async () => {
            const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=2500', {
                headers: { Authorization: `Bearer ${tokens.access_token}` }
            }).then((res) => res.json())
            return res
        },
        select: (data) => {
            const coloredEvents: CalendarEventWithColor[] = data.items.map((event: CalendarEventWithColor) => ({ ...event, color: getColorById(event.colorId) }))
            return coloredEvents
        },
        enabled: !!tokens.access_token
    })
    const { data: holidayItems } = useQuery({
        queryKey: ['googleCalendarHolidays'],
        queryFn: async () => {
            const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/ko.south_korea%23holiday%40group.v.calendar.google.com/events?maxResults=2500', {
                headers: { Authorization: `Bearer ${tokens.access_token}` }
            }).then((res) => res.json())
            return res
        },
        select: (data) => {
            // 공휴일만 필터링함
            const coloredEvents: CalendarEventWithColor[] = data.items
                .filter((event: CalendarEventWithColor) => isHolidayEvent(event))
                .map((event: CalendarEventWithColor) => ({ ...event, color: getColorById('10') }))
            return coloredEvents
        },
        enabled: !!tokens.access_token
    })
    const mergedItems = isShow ? [...(holidayItems ?? []), ...(items ?? [])] : (items ?? []) // event와 holiday를 합침 (공휴일표시 여부에 따라 필터링)
    return {
        items: mergedItems
    }
}
