import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { trackEvent } from '@aptabase/electron/renderer'

import { useAddEvent } from './AddEventForm.mutation'
import { EventForm } from '../EventForm'
import { FormState } from '../../types/FormType'
import { Kbd } from '@/shared/ui/kbd'

const initialFormState: FormState = {
    summary: '',
    colorId: '1',
    start: '08:00',
    end: '12:00',
    allDay: false
}
export function AddEventForm({ date }: { date: Date }) {
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState<FormState>(initialFormState)
    const { addEvent } = useAddEvent()
    const updateForm = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((prev) => ({ ...prev, [key]: value }))
    const resetForm = () => setForm(initialFormState)

    const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault()
        if (!form.summary.trim()) {
            toast.warning('일정 제목을 입력해주세요')
            return
        }
        addEvent({ date, ...form })
        setShowForm(false)
        trackEvent('AddEvent')
        const desc = form.allDay ? '하루 종일 일정으로 추가되었습니다.' : `${form.start} - ${form.end}에 일정이 추가되었습니다.`
        toast.success(`"${form.summary}" 일정이 추가되었습니다`, {
            description: `${date.toLocaleDateString()} ${desc}`
        })
        resetForm()
    }

    // Ctrl + Enter 단축키
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.getElementById('edit-event-form')) return

            if (e.ctrlKey && e.key === 'Enter') {
                if (showForm) {
                    handleSubmit()
                } else {
                    setShowForm(true)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showForm, form])

    return (
        <>
            {showForm ? (
                <EventForm form={form} updateForm={updateForm} onCancel={() => setShowForm(false)} onSubmit={handleSubmit} onSubmitText="추가" />
            ) : (
                <button
                    className="text-secondary mt-2 w-full rounded-xl border-2 border-dashed py-3 text-center"
                    onClick={() => {
                        setShowForm(true)
                        resetForm()
                    }}
                >
                    일정 추가
                    <Kbd className="ml-2">Ctrl + ⏎</Kbd>
                </button>
            )}
        </>
    )
}
