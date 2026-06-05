import { eventApi } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventKeys } from '../api/queries';

interface DeleteEventParams {
  eventId: string;
  recurringEventId?: string;
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  const deleteEventMutation = useMutation({
    mutationFn: async ({ eventId, recurringEventId }: DeleteEventParams) => {
      return eventApi.delete(recurringEventId ?? eventId);
    },
    onMutate: async ({ eventId, recurringEventId }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.events });
      const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(eventKeys.events);

      if (previousData) {
        const items = recurringEventId ? previousData.items.filter((e) => e.recurringEventId !== recurringEventId) : previousData.items.filter((e) => e.id !== eventId);
        queryClient.setQueryData(eventKeys.events, { ...previousData, items });
      }
      return { previousData };
    },
    onError: (_error, _variable, context) => queryClient.setQueryData(eventKeys.events, context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.events })
  });
  return { deleteEvent: deleteEventMutation.mutate };
}
