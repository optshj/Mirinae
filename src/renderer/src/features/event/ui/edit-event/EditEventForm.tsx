import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { trackEvent } from '@aptabase/electron/renderer'

import { EventForm } from '../EventForm'
import { useEditEvent } from './EditEventForm.mutation'
import { FormState } from '../../types/FormType'

import { ISO8601toSimpleTime } from '@/shared/lib/dateFunction'
import { CalendarEventWithColor, isAllDayEvent, isHolidayEvent } from '@/shared/types/EventType'
import { isTimeEvent } from '@/shared/types/EventType'

interface EditEventFormProps {
    event: CalendarEventWithColor
    deleteButton: React.ReactNode
}
export function EditEventForm({ event, deleteButton }: EditEventFormProps) {
    const [showForm, setShowForm] = useState(false)
    const { editEvent } = useEditEvent()

    const date = isTimeEvent(event) ? new Date(event.start.dateTime) : new Date(event.start.date)
    // form 초기화
    const [form, setForm] = useState<FormState>({
        summary: event.summary,
        colorId: event.colorId,
        start: isTimeEvent(event) ? ISO8601toSimpleTime(event.start.dateTime) : '08:00',
        end: isTimeEvent(event) ? ISO8601toSimpleTime(event.end.dateTime) : '12:00',
        allDay: isAllDayEvent(event)
    })
    const updateForm = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((prev) => ({ ...prev, [key]: value }))

    // 제출 처리
    const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault()
        if (!form.summary.trim()) {
            toast.warning('일정 제목을 입력해주세요')
            return
        }
        editEvent({
            eventId: event.id,
            date,
            ...form
        })
        setShowForm(false)
        trackEvent('EditEvent')
        const desc = form.allDay ? '하루 종일 일정으로 수정되었습니다.' : `${form.start} - ${form.end}에 일정이 수정되었습니다.`
        toast.success(`"${form.summary}" 일정이 수정되었습니다`, {
            description: `${date.toLocaleDateString()} ${desc}`
        })
    }

    const openForm = () => {
        if (!isHolidayEvent(event)) setShowForm(true)
    }

    // Ctrl + Enter 단축키
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                if (showForm) handleSubmit()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showForm, form])

    return (
        <>
            {showForm ? (
                <EventForm id={'edit-event-form'} form={form} updateForm={updateForm} onCancel={() => setShowForm(false)} onSubmit={handleSubmit} onSubmitText="수정" />
            ) : (
                <div
                    className="relative flex items-center justify-between rounded-xl p-3 dark:saturate-70"
                    style={{
                        backgroundColor: `${event.color.background}30`
                    }}
                    onDoubleClick={openForm}
                >
                    <div className="h-full w-2 rounded-xl" style={{ backgroundColor: event.color.background }} />
                    <div className="text-primary flex-1 pl-4">
                        <span className="font-semibold">{event.summary}</span>
                        <div className="mt-1 text-xs">
                            {isTimeEvent(event) ? `${new Date(event.start.dateTime).toLocaleString()} ~ ${new Date(event.end.dateTime).toLocaleString()}` : `${event.start.date} ~ ${event.end.date}`}
                        </div>
                    </div>
                    {!isHolidayEvent(event) && deleteButton}
                </div>
            )}
        </>
    )
}
