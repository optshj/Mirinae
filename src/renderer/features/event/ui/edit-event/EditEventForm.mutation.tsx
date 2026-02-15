import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { createEventBody } from '../../lib/createEventBody';
import { http } from '@/shared/lib/http';

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
            const response = await http.put<CalendarEvent>(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, eventData, {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`
                }
            });
            return response;
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
