import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { createEventBody } from '@/features/event/lib/createEventBody';
import { http } from '@/shared/lib/http';

interface AddEventProp {
    date: Date;
    start: string;
    end: string;
    summary: string;
    colorId: string;
    allDay: boolean;
}
export function useAddEvent() {
    const { tokens } = useLogin();
    const queryClient = useQueryClient();

    const addEventMutation = useMutation({
        mutationKey: ['addEvent'],
        mutationFn: async (variables: AddEventProp) => {
            const eventData = createEventBody(variables);
            const response = await http.post<CalendarEvent>(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, eventData, {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`
                }
            });
            return response;
        },
        onMutate: async (newEvent) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] });
            const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(['googleCalendarEvents']);
            const newEventItem = {
                ...createEventBody(newEvent),
                id: `temp-id-${Date.now()}`
            };

            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], {
                    items: [...previousData.items, newEventItem]
                });
            }

            return { previousData };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], context.previousData);
            }
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
    });

    return { addEvent: addEventMutation.mutate };
}
