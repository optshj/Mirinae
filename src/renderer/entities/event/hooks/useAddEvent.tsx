import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { createEventBody } from '@/features/event/lib/createEventBody';
import { eventApi } from '@/entities/event';

export function useAddEvent() {
  const queryClient = useQueryClient();

  const addEventMutation = useMutation({
    mutationFn: eventApi.create,
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] });
      const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(['googleCalendarEvents']);
      const newEventItem = {
        ...createEventBody(newEvent.eventData),
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
