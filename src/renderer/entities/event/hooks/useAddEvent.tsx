import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CalendarEvent } from '@/shared/types/EventType';
import { eventApi } from '@/entities/event';
import { eventKeys } from '../api/queries';
import { createEventBody } from '../lib/createEventBody';
import { AddEventProp } from '../types';

const RECURRENCE_UNIT_MAP = {
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
  YEARLY: 'year'
} as const;

function generateOptimisticEvents(newEvent: AddEventProp) {
  const tempIdBase = Date.now();

  if (!newEvent.recurrence) {
    return [{ ...createEventBody(newEvent), id: `temp-id-${tempIdBase}` }];
  }

  const unit = RECURRENCE_UNIT_MAP[newEvent.recurrence as keyof typeof RECURRENCE_UNIT_MAP];
  if (!unit) {
    return [{ ...createEventBody(newEvent), id: `temp-id-${tempIdBase}` }];
  }

  const instances: Array<ReturnType<typeof createEventBody> & { id: string }> = [];
  const endDate = dayjs().add(1, 'year');
  let currentDate = dayjs(newEvent.date);
  let count = 0;

  while (currentDate.isBefore(endDate) && count < 500) {
    const instanceBody = createEventBody({ ...newEvent, date: currentDate.toDate(), recurrence: null });
    instances.push({ ...instanceBody, id: `temp-id-${tempIdBase}-${count}` });
    currentDate = currentDate.add(1, unit);
    count++;
  }

  return instances;
}

export function useAddEvent() {
  const queryClient = useQueryClient();

  const addEventMutation = useMutation({
    mutationFn: async ({ ...bodyProps }: AddEventProp) => {
      const eventData = createEventBody(bodyProps);
      return eventApi.create(eventData);
    },
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.events });
      const previousData = queryClient.getQueryData<{ items: CalendarEvent[] }>(eventKeys.events);

      if (previousData) {
        queryClient.setQueryData(eventKeys.events, {
          items: [...previousData.items, ...generateOptimisticEvents(newEvent)]
        });
      }

      return { previousData };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(eventKeys.events, context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.events })
  });

  return { addEvent: addEventMutation.mutate };
}
