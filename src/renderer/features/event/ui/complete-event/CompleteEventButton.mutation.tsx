import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { http } from '@/shared/lib/http';

interface CompleteEventProp {
    eventId: string;
    isCompleted: string;
}
export function useCompleteEvent() {
    const { tokens } = useLogin();
    const queryClient = useQueryClient();

    const completeEventMutation = useMutation({
        mutationKey: ['completeEvent'],
        mutationFn: async ({ eventId, isCompleted }: CompleteEventProp) => {
            const patchBody = {
                extendedProperties: {
                    private: {
                        isCompleted: isCompleted
                    }
                }
            };
            const response = await http.patch<CalendarEvent>(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, patchBody, {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`
                }
            });
            return response;
        },
        onMutate: async ({ eventId, isCompleted }) => {
            await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] });
            const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(['googleCalendarEvents']);

            if (previousData) {
                queryClient.setQueryData(['googleCalendarEvents'], {
                    items: previousData.items.map((item) => {
                        if (item.id === eventId) {
                            return {
                                ...item,
                                extendedProperties: {
                                    private: {
                                        isCompleted: isCompleted
                                    }
                                }
                            };
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
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] });
        }
    });

    return { completeEvent: completeEventMutation.mutate };
}
