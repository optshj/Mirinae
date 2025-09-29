import { useLogin } from '@/shared/hooks/useLogin'
import { getColorById } from '@/features/event/lib/getColor'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventItemWithColor } from '@/shared/types/EventTypes'

export function useEditEvent() {
    const { tokens } = useLogin()
    const queryClient = useQueryClient()

    const editEventMutation = useMutation({
        mutationKey: ['editEvent'],
        mutationFn: async ({ eventId, date, startTime, endTime, summary, colorId }: { eventId: string; date: Date; startTime: string; endTime: string; summary: string; colorId: string }) => {
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
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.access_token}`
                },
                body: JSON.stringify(eventData)
            })

            return response.json()
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] })
            const previousData = queryClient.getQueryData<{
                items: EventItemWithColor[]
            }>(['googleCalendarEvents'])
            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], () => {
                    const { eventId, date, startTime, endTime, summary, colorId } = variables

                    const filteredItems = previousData.items.filter((item) => item.id !== eventId)

                    const [startHour, startMinute] = startTime.split(':').map(Number)
                    const [endHour, endMinute] = endTime.split(':').map(Number)
                    const startDateTime = new Date(date)
                    const endDateTime = new Date(date)
                    startDateTime.setHours(startHour, startMinute, 0, 0)
                    endDateTime.setHours(endHour, endMinute, 0, 0)
                    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

                    const updatedItem = {
                        ...previousData.items.find((item) => item.id === eventId)!,
                        id: eventId,
                        summary,
                        colorId: colorId || '1',
                        color: getColorById(colorId || '1'),
                        start: { dateTime: startDateTime.toISOString(), timeZone },
                        end: { dateTime: endDateTime.toISOString(), timeZone }
                    }

                    return {
                        ...previousData,
                        items: [...filteredItems, updatedItem]
                    }
                })
            }

            return { previousData }
        },
        onError: (_err, _variables, context: any) => queryClient.setQueryData(['googleCalendarEvents'], context.previousData),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
    })

    return { editEvent: editEventMutation.mutate }
}
