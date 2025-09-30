import { useEffect, useState } from 'react'
import { useEditEvent } from './EditEventForm.mutation'
import { toast } from 'sonner'
import { trackEvent } from '@aptabase/electron/renderer'
import { EventForm } from '../EventForm'
import { EventItemWithColor } from '@/shared/types/EventTypes'
import { ISO8601toSimpleTime } from '@/shared/lib/dateFunction'
import { FormState } from '../../types/FormType'

interface EditEventFormProps {
    event: EventItemWithColor
    deleteButton: React.ReactNode
}
export function EditEventForm({ event, deleteButton }: EditEventFormProps) {
    const [showForm, setShowForm] = useState(false)
    const { editEvent } = useEditEvent()
    const [form, setForm] = useState<FormState>({
        summary: event.summary,
        colorId: event.colorId,
        startTime: ISO8601toSimpleTime(event.start.dateTime),
        endTime: ISO8601toSimpleTime(event.end.dateTime)
    })

    const updateForm = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

    const date = new Date(event.start.dateTime)

    const handleSubmit = () => {
        if (performSubmit()) return
        setShowForm(false)
        trackEvent('EditEvent')
        toast.success(`"${form.summary}" 일정이 수정되었습니다`, {
            description: `${date.toLocaleDateString()} ${form.startTime} - ${form.endTime}에 일정이 수정되었습니다.`
        })
    }

    const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        handleSubmit()
    }

    const performSubmit = () => {
        if (!form.summary.trim()) {
            toast.warning('일정 제목을 입력해주세요')
            return true
        }
        editEvent({ eventId: event.id, date, ...form })
        return false
    }

    const openForm = () => {
        if (event.organizer?.displayName !== '대한민국의 휴일') setShowForm(true)
    }

    // Ctrl + Enter 단축키
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault()
                if (showForm) handleSubmit()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showForm, form])

    return (
        <>
            {showForm ? (
                <EventForm
                    id={'edit-event-form'}
                    form={form}
                    updateForm={updateForm}
                    onCancel={() => setShowForm(false)}
                    onSubmit={onFormSubmit}
                    onSubmitText="수정"
                    defaultTime={[form.startTime, form.endTime]}
                />
            ) : (
                // 기본 이벤트 아이템
                <div
                    key={event.id}
                    className="relative flex items-center justify-between rounded-xl p-3 dark:saturate-70"
                    style={{
                        backgroundColor: `${event.color.background}30`
                    }}
                    onDoubleClick={openForm}
                >
                    <div
                        className="h-full w-2 rounded-xl"
                        style={{
                            backgroundColor: event.color.background
                        }}
                    />
                    <div className="text-primary flex-1 pl-4">
                        <span className="font-semibold">{event.summary}</span>
                        <div className="mt-1 text-xs">
                            {event.start.dateTime ? `${new Date(event.start.dateTime).toLocaleString()} ~ ${new Date(event.end.dateTime).toLocaleString()}` : `${event.start.date} ~ ${event.end.date}`}
                        </div>
                    </div>
                    {event.organizer?.displayName === '대한민국의 휴일' ? null : deleteButton}
                </div>
            )}
        </>
    )
}
