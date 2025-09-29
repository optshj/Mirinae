import { useLogin } from '@/shared/hooks/useLogin'
import { getColorById } from '@/features/event/lib/getColor'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventItemWithColor } from '@/shared/types/EventTypes'

export function useAddEvent() {
    const { tokens } = useLogin()
    const queryClient = useQueryClient()

    const addEventMutation = useMutation({
        mutationKey: ['addEvent'],
        mutationFn: async ({ date, startTime, endTime, summary, colorId }: { date: Date; startTime: string; endTime: string; summary: string; colorId: string }) => {
            const [startHour, startMinute] = startTime.split(':').map(Number)
            const [endHour, endMinute] = endTime.split(':').map(Number)
            const startDateTime = new Date(date)
            const endDateTime = new Date(date)
            startDateTime.setHours(startHour, startMinute, 0, 0)
            endDateTime.setHours(endHour, endMinute, 0, 0)
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

            const eventData = {
                summary,
                start: { dateTime: startDateTime.toISOString(), timeZone },
                end: { dateTime: endDateTime.toISOString(), timeZone },
                colorId: colorId || '1'
            }

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.access_token}`
                },
                body: JSON.stringify(eventData)
            })

            return response.json()
        },
        onMutate: async (newEvent) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] })
            const previousData = queryClient.getQueryData<{
                items: EventItemWithColor[]
            }>(['googleCalendarEvents'])
            const [startHour, startMinute] = newEvent.startTime.split(':').map(Number)
            const [endHour, endMinute] = newEvent.endTime.split(':').map(Number)
            const startDateTime = new Date(newEvent.date)
            const endDateTime = new Date(newEvent.date)
            startDateTime.setHours(startHour, startMinute, 0, 0)
            endDateTime.setHours(endHour, endMinute, 0, 0)
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
            const newEventItem = {
                id: 'temp-id-' + Date.now(),
                kind: 'calendar#event',
                etag: 'temp-etag-' + Date.now(),
                status: 'confirmed',
                summary: newEvent.summary,
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: timeZone
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: timeZone
                },
                colorId: newEvent.colorId || '1',
                color: getColorById(newEvent.colorId || '1')
            }

            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], {
                    items: [...previousData.items, newEventItem]
                })
            }

            return { previousData }
        },
        onError: (_err, _variables, context: any) => queryClient.setQueryData(['googleCalendarEvents'], context.previousData),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
    })
    return { addEvent: addEventMutation.mutate }
}
