import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventApi } from '@/entities/event';
import { eventKeys } from '../api/queries';

interface CompleteEventParams {
  eventId: string;
  completed: boolean;
}

export function useCompleteEvent() {
  const queryClient = useQueryClient();

  const completeEventMutation = useMutation({
    mutationFn: ({ eventId, completed }: CompleteEventParams) => eventApi.setCompleted({ eventId, completed }),
    onMutate: async ({ eventId, completed }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.events });
      const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(eventKeys.events);

      if (previousData) {
        queryClient.setQueryData(eventKeys.events, {
          ...previousData,
          items: previousData.items.map((item) =>
            item.id === eventId
              ? {
                  ...item,
                  extendedProperties: {
                    ...item.extendedProperties,
                    private: { ...item.extendedProperties?.private, completed: completed ? 'true' : 'false' }
                  }
                }
              : item
          )
        });
      }
      return { previousData };
    },
    onError: (_err, _variables, context) => queryClient.setQueryData(eventKeys.events, context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.events })
  });

  return { completeEvent: completeEventMutation.mutate };
}
