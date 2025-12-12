import { AddEventForm, CompleteEventButton, DeleteEventButton, EditEventForm, useCalendarItems } from '@/features/event';

import { isSameDay } from '@/shared/lib/dateFunction';
import { isTimeEvent } from '@/shared/types/EventType';
import { DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

export function ScheduleModal({ date }: { date: Date }) {
    const { items } = useCalendarItems();
    const events = items.filter((event) => {
        const eventDate = isTimeEvent(event) ? new Date(event.start.dateTime) : new Date(event.start.date);
        return isSameDay(eventDate, date);
    });

    return (
        <DialogContent>
            <DialogHeader>
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
