import { useLogin } from '@/shared/hooks/useLogin'
import { EventItemWithColor } from '@/shared/types/EventTypes'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useDeleteEvent() {
    const { tokens } = useLogin()
    const queryClient = useQueryClient()
    const deleteEventMutation = useMutation({
        mutationKey: ['deleteEvent'],
        mutationFn: async (eventId: string) => {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`
                }
            })

            if (!response.ok) throw new Error('Failed to delete event')
            return eventId
        },
        onMutate: async (eventId) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] })
            const previousData = queryClient.getQueryData<{
                items: EventItemWithColor[]
            }>(['googleCalendarEvents'])

            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], {
                    ...previousData,
                    items: previousData.items.filter((event) => event.id !== eventId)
                })
            }
            return { previousData }
        },
        onError: (_error, _variable, context: any) => queryClient.setQueryData(['googleCalendarEvents'], context.previousData),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
    })
    return { deleteEvent: deleteEventMutation.mutate }
}
