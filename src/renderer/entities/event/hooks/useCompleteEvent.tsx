import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventApi } from '@/entities/event';

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
      return eventApi.complete({ accessToken: tokens.access_token, eventId, patchBody });
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
