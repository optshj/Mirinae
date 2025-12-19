import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { createEventBody } from '../../lib/createEventBody';

interface EditEventProp {
    eventId: string;
    date: Date;
    start: string;
    end: string;
    summary: string;
    colorId: string;
    allDay: boolean;
}
export function useEditEvent() {
    const { tokens } = useLogin();
    const queryClient = useQueryClient();

    const editEventMutation = useMutation({
        mutationKey: ['editEvent'],
        mutationFn: async ({ eventId, ...bodyProps }: EditEventProp) => {
            const eventData = createEventBody(bodyProps);
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.access_token}`
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                throw new Error('Failed to edit event');
            }

            return response.json();
        },
        onMutate: async ({ eventId, ...bodyProps }) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] });
            const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(['googleCalendarEvents']);
            const updatedEventPart = createEventBody(bodyProps);

            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], {
                    items: previousData.items.map((item) => {
                        if (item.id === eventId) {
                            return { ...item, ...updatedEventPart, id: eventId };
                        }
                        return item;
                    })
                });
            }

            return { previousData };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], context.previousData);
            }
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
    });

    return { editEvent: editEventMutation.mutate };
}
