import { useEffect, useState } from 'react'
import { useAddEvent } from './AddEventForm.mutation'
import { toast } from 'sonner'
import { trackEvent } from '@aptabase/electron/renderer'
import { EventForm } from '../EventForm'
import { FormState } from '../../types/FormType'

const initialFormState: FormState = {
    summary: '',
    colorId: '1',
    startTime: '08:00',
    endTime: '12:00'
}
export function AddEventForm({ date }: { date: Date }) {
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState<FormState>(initialFormState)
    const updateForm = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }))
    const resetForm = () => setForm(initialFormState)

    const { addEvent } = useAddEvent()

    const handleSubmit = () => {
        if (performSubmit()) return
        setShowForm(false)
        resetForm()
        trackEvent('AddEvent')
        toast.success(`"${form.summary}" 일정이 추가되었습니다`, {
            description: `${date.toLocaleDateString()} ${form.startTime} - ${form.endTime}에 일정이 추가되었습니다.`
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
        addEvent({ date, ...form })
        return false
    }

    // Ctrl + Enter 단축키
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.getElementById('edit-event-form')) {
                return
            }
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault()
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
                <EventForm form={form} updateForm={updateForm} onCancel={() => setShowForm(false)} onSubmit={onFormSubmit} onSubmitText="추가" />
            ) : (
                <button
                    className="text-secondary mt-2 w-full rounded-xl border-2 border-dashed py-3 text-center"
                    onClick={() => {
                        setShowForm(true)
                        resetForm()
                    }}
                >
                    + 일정 추가
                </button>
            )}
        </>
    )
}
