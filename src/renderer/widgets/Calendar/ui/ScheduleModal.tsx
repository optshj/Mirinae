import { useCalendarItems } from '@/entities/event';
import { AddEventForm, CompleteEventButton, DeleteEventButton, EditEventForm } from '@/features/event';

import { isSameDay } from '@/shared/lib/dateFunction';
import { DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

export function ScheduleModal({ date }: { date: Date }) {
  const { items } = useCalendarItems();

  const events = items.filter((event) => {
    const eventDate = event.category === 'time' ? new Date(event.start.dateTime) : new Date(event.start.date);

    return isSameDay(eventDate, date);
  });

  return (
    <DialogContent>
      <DialogHeader className="mb-2">
        <DialogTitle>
          {date.getMonth() + 1}월 {date.getDate()}일 일정
        </DialogTitle>
      </DialogHeader>
      {events.map((event) => (
        <EditEventForm
          key={event.id}
          event={event}
          deleteButton={<DeleteEventButton eventId={event.id} />}
          completeButton={<CompleteEventButton eventId={event.id} isCompleted={event.extendedProperties.private.isCompleted} />}
        />
      ))}
      <AddEventForm date={date} />
    </DialogContent>
  );
}
