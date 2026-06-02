import { CalendarOff } from 'lucide-react';
import dayjs from 'dayjs';
import { AddEventForm, CompleteEventButton, DeleteEventButton, EditEventForm } from '@/features/event';
import { useCalendarItems, getEventRange } from '@/entities/event';
import { DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { getDDay } from '../lib/getDDay';

export function ScheduleModal({ date }: { date: Date }) {
  const dDay = getDDay(date);
  const isToday = dDay === 'Today';
  const { items } = useCalendarItems();
  const targetKey = dayjs(date).format('YYYY-MM-DD');
  const events = items.filter((event) => {
    const [start, end] = getEventRange(event);
    return start <= targetKey && targetKey <= end;
  });

  return (
    <DialogContent>
      <DialogHeader className="mb-2 text-left">
        <DialogTitle className="flex flex-row items-baseline gap-3">
          <span className="text-foreground text-3xl font-bold tracking-tight">
            {date.getMonth() + 1}월 {date.getDate()}일
          </span>
          <span className="text-secondary text-sm font-medium tracking-wide"> {isToday ? 'Today' : dDay} </span>
        </DialogTitle>
      </DialogHeader>
      {events.map((event) => {
        return (
          <EditEventForm
            key={event.id}
            event={event}
            deleteButton={<DeleteEventButton event={event} />}
            completeButton={<CompleteEventButton eventId={event.id} isCompleted={event.extendedProperties.private.isCompleted} />}
          />
        );
      })}
      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center [html.show-event-form_&]:hidden">
          <div className="text-secondary my-4 flex items-center justify-center">
            <CalendarOff size={36} strokeWidth={0.75} />
          </div>
          <h3 className="text-primary text-lg font-medium">오늘은 일정이 없어요</h3> <p className="text-secondary mt-1 mb-4 text-sm">아래 버튼으로 새로운 일정을 추가해보세요.</p>
        </div>
      )}
      <AddEventForm date={date} />
    </DialogContent>
  );
}
