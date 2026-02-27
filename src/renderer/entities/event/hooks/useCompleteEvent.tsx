import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventApi } from '@/entities/event';
import { eventKeys } from '../api/queries';

interface CompleteEventProp {
  eventId: string;
  isCompleted: string;
}
export function useCompleteEvent() {
  const { tokens } = useLogin();
  const queryClient = useQueryClient();

  const completeEventMutation = useMutation({
    mutationFn: async ({ eventId, isCompleted }: CompleteEventProp) => {
      const patchBody = {
        extendedProperties: {
          private: {
            isCompleted: isCompleted
          }
        }
      };
      return eventApi.complete({ accessToken: tokens.access_token, eventId, patchBody });
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
    onError: (_err, _variables, context) => queryClient.setQueryData(eventKeys.events, context?.previousData),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.events });
    }
  });

  return { completeEvent: completeEventMutation.mutate };
}
