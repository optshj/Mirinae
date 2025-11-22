import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { formatDateLocal, makeDateTime, toIsoStringWithOffset } from '@/shared/lib/dateFunction';

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
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.access_token}`
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                throw new Error('Failed to add event');
            }

            return response.json();
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

function createEventBody({ date, start, end, summary, colorId, allDay }: AddEventProp) {
    if (allDay) {
        const startDate = formatDateLocal(date);
        const endDateObj = new Date(date);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDate = formatDateLocal(endDateObj);

        return {
            summary,
            start: { date: startDate },
            end: { date: endDate },
            colorId: colorId || '1'
        };
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDateTime = makeDateTime(date, start);
    const endDateTime = makeDateTime(date, end);

    return {
        summary,
        start: { dateTime: toIsoStringWithOffset(startDateTime), timeZone },
        end: { dateTime: toIsoStringWithOffset(endDateTime), timeZone },
        colorId: colorId || '1'
    };
}
