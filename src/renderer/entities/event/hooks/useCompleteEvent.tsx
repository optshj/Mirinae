import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventKeys } from '../api/queries';

interface CompleteEventProp {
  eventId: string;
  isCompleted: boolean;
}
export function useCompleteEvent() {
  const queryClient = useQueryClient();

  const completeEventMutation = useMutation({
    mutationFn: async ({ eventId, isCompleted }: CompleteEventProp) => {
      const patchBody = {
        extendedProperties: {
          private: {
            isCompleted: String(isCompleted)
          }
        }
      };
      return eventApi.complete({ eventId, patchBody });
    },
    onMutate: async ({ eventId, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.events });
      const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(eventKeys.events);

      if (previousData) {
        queryClient.setQueryData(eventKeys.events, {
          items: previousData.items.map((item) => {
            if (item.id === eventId) {
              return {
                ...item,
                extendedProperties: { private: { isCompleted: String(isCompleted) } }
              };
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

  return { completeEvent: completeEventMutation.mutate };
}
