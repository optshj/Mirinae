import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { formatDateLocal, makeDateTime } from '@/shared/lib/dateFunction';

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
        mutationFn: async ({ eventId, date, start, end, summary, colorId, allDay }: EditEventProp) => {
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
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.access_token}`
                },
                body: JSON.stringify(eventData)
            });

            return response.json();
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] });
            const previousData = queryClient.getQueryData<{
                items: CalendarEvent[];
            }>(['googleCalendarEvents']);
            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], () => {
                    const { eventId, date, start, end, summary, colorId } = variables;

                    const filteredItems = previousData.items.filter((item) => item.id !== eventId);
                    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    let updatedItem;
                    if (variables.allDay) {
                        // 하루 종일의 경우
                        const startDate = formatDateLocal(date);
                        const endDateObj = new Date(date);
                        endDateObj.setDate(endDateObj.getDate() + 1);
                        const endDate = formatDateLocal(endDateObj);
                        updatedItem = {
                            summary,
                            start: { date: startDate },
                            end: { date: endDate },
                            colorId: colorId || '1'
                        };
                    } else {
                        // 아닌 경우
                        const startDateTime = makeDateTime(date, start);
                        const endDateTime = makeDateTime(date, end);
                        updatedItem = {
                            summary,
                            start: { dateTime: startDateTime.toISOString(), timeZone },
                            end: { dateTime: endDateTime.toISOString(), timeZone },
                            colorId: colorId || '1'
                        };
                    }

                    return {
                        ...previousData,
                        items: [...filteredItems, updatedItem]
                    };
                });
            }

            return { previousData };
        },
        onError: (_err, _variables, context: any) => queryClient.setQueryData(['googleCalendarEvents'], context.previousData),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
    });

    return { editEvent: editEventMutation.mutate };
}
