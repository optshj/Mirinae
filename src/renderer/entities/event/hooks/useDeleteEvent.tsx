import { eventApi } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  const deleteEventMutation = useMutation({
    mutationFn: eventApi.delete,
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: ['googleCalendarEvents'] });
      const previousData = queryClient.getQueryData<{
        items: CalendarEvent[];
      }>(['googleCalendarEvents']);
      console.log(eventId);

      if (previousData) {
        queryClient.setQueryData(['googleCalendarEvents'], {
          ...previousData,
          items: previousData.items.filter((event) => event.id !== eventId.eventId)
        });
      }
      return { previousData };
    },
    onError: (_error, _variable, context) => queryClient.setQueryData(['googleCalendarEvents'], context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['googleCalendarEvents'] })
  });
  return { deleteEvent: deleteEventMutation.mutate };
}
