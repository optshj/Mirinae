import { useState } from 'react';
import { toast } from 'sonner';
import { trackEvent } from '@aptabase/electron/renderer';

import { EventForm } from '../components/EventForm';
import { useEditEvent } from './EditEventForm.mutation';
import { FormState } from '../../types/FormType';

import { CalendarEvent, isAllDayEvent, isHolidayEvent, isTimeEvent } from '@/shared/types/EventType';

//2025-09-17T18:00:00+09:00 -> 18:00
function formatToHHmm(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Seoul'
    });
}

interface EditEventFormProps {
    event: CalendarEvent;
    deleteButton: React.ReactNode;
    completeButton: React.ReactNode;
}
export function EditEventForm({ event, deleteButton, completeButton }: EditEventFormProps) {
    const { editEvent } = useEditEvent();

    const date = isTimeEvent(event) ? new Date(event.start.dateTime) : new Date(event.start.date);
    const [form, setForm] = useState<FormState>({
        summary: event.summary,
        colorId: event.colorId,
        start: isTimeEvent(event) ? formatToHHmm(event.start.dateTime) : '08:00',
        end: isTimeEvent(event) ? formatToHHmm(event.end.dateTime) : '12:00',
        allDay: isAllDayEvent(event)
    });
    const updateForm = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!form.summary.trim()) {
            toast.warning('일정 제목을 입력해주세요');
            return;
        }
        editEvent({
            eventId: event.id,
            date,
            ...form
        });
        trackEvent('EditEvent');
        const desc = form.allDay ? '하루 종일 일정으로 수정되었습니다.' : `${form.start} - ${form.end}에 일정이 수정되었습니다.`;
        toast.success(`"${form.summary}" 일정이 수정되었습니다`, {
            description: `${date.toLocaleDateString()} ${desc}`
        });
    };

    return <EventForm form={form} updateForm={updateForm} onSubmit={handleSubmit} type="edit" trigger={<Event event={event} deleteButton={deleteButton} completeButton={completeButton} />} />;
}

function Event({ event, deleteButton, completeButton }: { event: CalendarEvent; deleteButton: React.ReactNode; completeButton: React.ReactNode }) {
    const isHoliday = isHolidayEvent(event);

    const preventHolidayClick = (e: React.MouseEvent) => {
        if (isHoliday) {
            e.stopPropagation();
        }
    };
    return (
        <div
            className={`relative flex items-center justify-between rounded-xl p-3 dark:saturate-70 event-color-${event.colorId} bg-(--event-color)/20 ${event.extendedProperties.private.isCompleted === 'true' ? 'opacity-50' : ''}`}
            onClick={preventHolidayClick}
        >
            <div className={`h-10 w-2 rounded-xl event-color-${event.colorId} bg-(--event-color)`} />
            <div className="text-primary flex-1 pl-4">
                <span className="font-semibold">{event.summary}</span>
                <div className="mt-1 text-xs">
                    {isTimeEvent(event) ? `${new Date(event.start.dateTime).toLocaleString()} ~ ${new Date(event.end.dateTime).toLocaleString()}` : `${event.start.date}`}
                </div>
            </div>
            {!isHoliday && (
                <div className="flex items-center gap-2">
                    {completeButton}
                    {deleteButton}
                </div>
            )}
        </div>
    );
}
