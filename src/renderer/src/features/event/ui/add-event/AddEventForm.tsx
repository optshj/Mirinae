import { useEffect, useState } from 'react'

import { Check } from 'lucide-react'
import { useAddEvent } from './AddEventForm.mutation'
import { getColorById, getPalette } from '@/features/event/lib/getColor'

import HangulInput from '@/shared/ui/HangulInput'
import { toast } from 'sonner'
import { Dial } from '../Dial'
import { trackEvent } from '@aptabase/electron/renderer'

interface FormState {
    summary: string
    colorId: string
    startTime: string
    endTime: string
}
export function AddEventForm({ date }: { date: Date }) {
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState<FormState>({
        summary: '',
        colorId: '1',
        startTime: '08:00',
        endTime: '10:00'
    })
    const updateForm = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }))
    const resetForm = () => setForm({ summary: '', colorId: '1', startTime: '08:00', endTime: '10:00' })

    const selectedColor = getColorById(form.colorId).background
    const palette = getPalette()
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

    // crtl + enter키로 제출 또는 폼을 여는 리스너
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.getElementById('edit-event-form')) {
                return //수정폼이 열려있으면 안열리게
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
                <form onSubmit={onFormSubmit} className="flex flex-col gap-4 rounded-xl border p-4 dark:saturate-70" style={{ borderColor: selectedColor }}>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="summary" style={{ color: selectedColor }}>
                            일정 제목
                        </label>
                        <HangulInput
                            id="summary"
                            placeholder="일정을 입력해주세요"
                            className="text-primary rounded-lg border border-zinc-300 py-2 pr-20 pl-3 focus:ring-0 focus:outline-none dark:saturate-70"
                            type="text"
                            value={form.summary}
                            onChange={(newSummary) => updateForm('summary', newSummary)}
                            autoFocus
                            style={{ borderColor: selectedColor }}
                        />
                    </div>
                    <div>
                        <label style={{ color: selectedColor }}>시간 선택</label>
                        <div className="relative -my-5 flex flex-col items-center justify-center">
                            <div className="text-primary absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col">
                                <div>
                                    <span style={{ color: selectedColor }}>{`시작 : `}</span>
                                    <span>{`${form.startTime}`}</span>
                                </div>
                                <div>
                                    <span style={{ color: selectedColor }}>{`종료 : `}</span>
                                    <span>{`${form.endTime}`}</span>
                                </div>
                            </div>
                            <Dial updateForm={updateForm} color={selectedColor} />
                        </div>
                    </div>
                    <div className="grid grid-cols-6 gap-2 px-2">
                        {Object.entries(palette).map(([key, color]) => (
                            <div
                                key={key}
                                className="m flex h-6 w-6 cursor-pointer items-center justify-center rounded-full dark:saturate-70"
                                style={{ backgroundColor: color.background }}
                                onClick={() => updateForm('colorId', key)}
                            >
                                {form.colorId === key && <Check className="text-white" size={16} />}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <button type="button" className="rounded-lg border border-zinc-300 bg-zinc-100 px-6 py-1.5 font-semibold whitespace-nowrap text-zinc-500" onClick={() => setShowForm(false)}>
                            취소
                        </button>
                        <button type="submit" className="rounded-lg px-6 py-1.5 font-semibold whitespace-nowrap text-white dark:saturate-70" style={{ backgroundColor: selectedColor }}>
                            추가
                        </button>
                    </div>
                </form>
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
