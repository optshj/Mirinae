import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventApi } from '@/entities/event';
import { eventKeys } from '../api/queries';
import { createEventBody } from '../lib/createEventBody';
import { AddEventProp } from '../types';

export function useAddEvent() {
  const queryClient = useQueryClient();

  const addEventMutation = useMutation({
    mutationFn: async ({ ...bodyProps }: AddEventProp) => {
      const eventData = createEventBody(bodyProps);
      return eventApi.create(eventData);
    },
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.events });
      const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(eventKeys.events);
      const newEventItem = {
        ...createEventBody(newEvent),
        id: `temp-id-${Date.now()}`
      };

      if (previousData) {
        queryClient.setQueryData(eventKeys.events, {
          items: [...previousData.items, newEventItem]
        });
      }

      return { previousData };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(eventKeys.events, context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.events })
  });

  return { addEvent: addEventMutation.mutate };
}
