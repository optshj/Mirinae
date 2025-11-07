import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { formatDateLocal, makeDateTime } from '@/shared/lib/dateFunction';

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
        mutationFn: async ({ date, start, end, summary, colorId, allDay }: AddEventProp) => {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            let eventData;
            if (allDay) {
                // 하루 종일의 경우
                const startDate = formatDateLocal(date);
                const endDateObj = new Date(date);
                endDateObj.setDate(endDateObj.getDate() + 1);
                const endDate = formatDateLocal(endDateObj);
                eventData = {
                    summary,
                    start: { date: startDate },
                    end: { date: endDate },
                    colorId: colorId || '1'
                };
            } else {
                // 아닌 경우
                const startDateTime = makeDateTime(date, start);
                const endDateTime = makeDateTime(date, end);
                eventData = {
                    summary,
                    start: { dateTime: startDateTime.toISOString(), timeZone },
                    end: { dateTime: endDateTime.toISOString(), timeZone },
                    colorId: colorId || '1'
                };
            }

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.access_token}`
                },
                body: JSON.stringify(eventData)
            });

            return response.json();
        },
        onMutate: async (newEvent) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] });
            const previousData = queryClient.getQueryData<{
                items: CalendarEvent[];
            }>(['googleCalendarEvents']);
            let newEventItem;
            if (newEvent.allDay) {
                // 하루 종일의 경우
                const startDate = formatDateLocal(newEvent.date);
                const endDateObj = new Date(newEvent.date);
                endDateObj.setDate(endDateObj.getDate() + 1);
                const endDate = formatDateLocal(endDateObj);
                newEventItem = {
                    id: 'temp-id-' + Date.now(),
                    summary: newEvent.summary,
                    start: { date: startDate },
                    end: { date: endDate },
                    colorId: newEvent.colorId || '1'
                };
            } else {
                // 아닌 경우
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const startDateTime = makeDateTime(newEvent.date, newEvent.start);
                const endDateTime = makeDateTime(newEvent.date, newEvent.end);
                newEventItem = {
                    id: 'temp-id-' + Date.now(),
                    summary: newEvent.summary,
                    start: { dateTime: startDateTime.toISOString(), timeZone },
                    end: { dateTime: endDateTime.toISOString(), timeZone },
                    colorId: newEvent.colorId || '1'
                };
            }

            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], {
                    items: [...previousData.items, newEventItem]
                });
            }

            return { previousData };
        },
        onError: (_error, _variables, context: any) => queryClient.setQueryData(['googleCalendarEvents'], context.previousData),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
    });
    return { addEvent: addEventMutation.mutate };
}
