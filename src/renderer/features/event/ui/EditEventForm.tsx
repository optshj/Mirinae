import dayjs from 'dayjs';
import { useState } from 'react';
import { toast } from 'sonner';
import { trackEvent } from '@aptabase/electron/renderer';

import { EventForm } from './components/EventForm';
import { FormState } from '../types/FormType';

import { CalendarEvent } from '@/shared/types/EventType';
import { useEditEvent, getEventRange } from '@/entities/event';

interface EditEventFormProps {
  event: CalendarEvent;
  deleteButton: React.ReactNode;
  completeButton: React.ReactNode;
}
export function EditEventForm({ event, deleteButton, completeButton }: EditEventFormProps) {
  const { editEvent } = useEditEvent();

  const date = event.category === 'time' ? new Date(event.start.dateTime) : new Date(event.start.date);
  const [form, setForm] = useState<FormState>({
    summary: event.summary,
    colorId: event.colorId,
    start: event.category === 'time' ? dayjs(event.start.dateTime).format('HH:mm') : '08:00',
    end: event.category === 'time' ? dayjs(event.end.dateTime).format('HH:mm') : '12:00',
    allDay: event.category === 'allDay',
    recurrence: null
  });
  const updateForm = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!form.summary.trim()) {
      toast.warning('일정 제목을 입력해주세요');
      return false;
    }
    editEvent({
      eventId: event.id,
      date,
      ...form
    });
    trackEvent('EditEvent');
    toast.success(`일정이 수정되었습니다`);
    return true;
  };

  return <EventForm form={form} updateForm={updateForm} onSubmit={handleSubmit} type="edit" trigger={<Event event={event} deleteButton={deleteButton} completeButton={completeButton} />} />;
}

function Event({ event, deleteButton, completeButton }: { event: CalendarEvent; deleteButton: React.ReactNode; completeButton: React.ReactNode }) {
  const isHoliday = event.category === 'holiday';
  const [start, end] = getEventRange(event);
  const isMultiDay = start !== end;

  const renderTimeRange = () => {
    if (event.category !== 'time') return '하루 종일';
    if (isMultiDay) return `${dayjs(event.start.dateTime).format('M월 D일 A h:mm')} ~ ${dayjs(event.end.dateTime).format('M월 D일 A h:mm')}`;
    return `${dayjs(event.start.dateTime).format('A h:mm')} ~ ${dayjs(event.end.dateTime).format('A h:mm')}`;
  };

  return (
    <div
      className={`relative flex items-center justify-between rounded-xl p-3 dark:saturate-70 [html.show-event-form_&]:hidden event-color-${event.colorId} bg-(--event-color)/20 ${event.extendedProperties.private.isCompleted && 'opacity-50'}`}
      onClick={(e) => {
        if (isHoliday) e.stopPropagation();
      }}
    >
      <div className={`h-10 w-2 rounded-xl event-color-${event.colorId} bg-(--event-color)`} />
      <div className="text-primary flex-1 pl-3">
        <span className="font-semibold">{event.summary}</span>
        <div className="text-xs">{renderTimeRange()}</div>
      </div>
      {!isHoliday && (
        <div className="flex items-center gap-1">
          {completeButton}
          {deleteButton}
        </div>
      )}
    </div>
  );
}
