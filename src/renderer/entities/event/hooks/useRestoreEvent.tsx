import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventKeys } from '../api/queries';

interface RestoreEventParams {
  eventId: string;
  event?: CalendarEvent;
}

export function useRestoreEvent() {
  const queryClient = useQueryClient();

  const restoreEventMutation = useMutation({
    mutationFn: async ({ eventId }: RestoreEventParams) => {
      return eventApi.restore(eventId);
    },
    onMutate: async ({ event }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.events });
      const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(eventKeys.events);

      if (previousData && event) {
        queryClient.setQueryData(eventKeys.events, { ...previousData, items: [...previousData.items, event] });
      }
      return { previousData };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(eventKeys.events, context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.events })
  });

  return { restoreEvent: restoreEventMutation.mutate };
}
