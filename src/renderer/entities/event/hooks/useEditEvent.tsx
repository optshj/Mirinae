import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventApi } from '@/entities/event';
import { createEventBody } from '../lib/createEventBody';
import { eventKeys } from '../api/queries';
import { EditEventProp } from '../types';

export function useEditEvent() {
  const queryClient = useQueryClient();

  const editEventMutation = useMutation({
    mutationFn: async ({ eventId, ...bodyProps }: EditEventProp) => {
      const eventData = createEventBody(bodyProps);
      return eventApi.update({ eventId, eventData });
    },
    onMutate: async ({ eventId, ...bodyProps }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.events });
      const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(eventKeys.events);
      const updatedEventPart = createEventBody(bodyProps);

      if (previousData) {
        queryClient.setQueryData(eventKeys.events, {
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
    onError: (_err, _variables, context) => queryClient.setQueryData(eventKeys.events, context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.events })
  });

  return { editEvent: editEventMutation.mutate };
}
