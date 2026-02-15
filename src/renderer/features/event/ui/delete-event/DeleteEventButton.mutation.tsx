import { useLogin } from '@/shared/hooks/useLogin';
import { http } from '@/shared/lib/http';
import { CalendarEvent } from '@/shared/types/EventType';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteEvent() {
    const { tokens } = useLogin();
    const queryClient = useQueryClient();
    const deleteEventMutation = useMutation({
        mutationKey: ['deleteEvent'],
        mutationFn: async (eventId: string) => {
            await http.delete(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`
                }
            });
            return eventId;
        },
        onMutate: async (eventId) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] });
            const previousData = queryClient.getQueryData<{
                items: CalendarEvent[];
            }>(['googleCalendarEvents']);

            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], {
                    ...previousData,
                    items: previousData.items.filter((event) => event.id !== eventId)
                });
            }
            return { previousData };
        },
        onError: (_error, _variable, context: any) => queryClient.setQueryData(['googleCalendarEvents'], context.previousData),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
    });
    return { deleteEvent: deleteEventMutation.mutate };
}
