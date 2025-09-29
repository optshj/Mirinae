import { AddEventForm, DeleteEventButton, EditEventForm, useCalendarItems } from '@/features/event'

import { isSameDay } from '@/shared/lib/dateFunction'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

export function ScheduleModal({ date }: { date: Date }) {
    const { items } = useCalendarItems()
    const events = items.filter((item) => {
        const eventDate = item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date)
        return isSameDay(eventDate, date)
    })
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {date.getMonth() + 1}월 {date.getDate()}일 일정
                </DialogTitle>
                <DialogDescription></DialogDescription>
            </DialogHeader>
            {events.map((event) => (
                <EditEventForm event={event} deleteButton={<DeleteEventButton eventId={event.id} />} />
            ))}
            <AddEventForm date={date} />
        </DialogContent>
    )
}
