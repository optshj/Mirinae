import { useLogin } from '@/shared/hooks/useLogin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventApi } from '@/entities/event';
import { createEventBody } from '@/features/event/lib/createEventBody';
import { eventKeys } from '../api/queries';

interface EditEventProp {
  eventId: string;
  date: Date;
  start: string;
  end: string;
  summary: string;
  colorId: string;
  allDay: boolean;
}
export function useEditEvent() {
  const { tokens } = useLogin();
  const queryClient = useQueryClient();

  const editEventMutation = useMutation({
    mutationKey: ['editEvent'],
    mutationFn: async ({ eventId, ...bodyProps }: EditEventProp) => {
      const eventData = createEventBody(bodyProps);
      return eventApi.update({ accessToken: tokens.access_token, eventId, eventData });
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
