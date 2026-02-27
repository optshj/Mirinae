import { eventApi } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventKeys } from '../api/queries';

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  const deleteEventMutation = useMutation({
    mutationFn: eventApi.delete,
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.events });
      const previousData = queryClient.getQueryData<{
        items: CalendarEvent[];
      }>(eventKeys.events);

      if (previousData) {
        queryClient.setQueryData(eventKeys.events, {
          ...previousData,
          items: previousData.items.filter((event) => event.id !== eventId.eventId)
        });
      }
      return { previousData };
    },
    onError: (_error, _variable, context) => queryClient.setQueryData(eventKeys.events, context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.events })
  });
  return { deleteEvent: deleteEventMutation.mutate };
}
