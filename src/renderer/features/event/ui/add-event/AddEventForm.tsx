import { useState } from 'react';
import { toast } from 'sonner';
import { trackEvent } from '@aptabase/electron/renderer';

import { useAddEvent } from './AddEventForm.mutation';
import { EventForm } from '../EventForm';
import { FormState } from '../../types/FormType';
import { Kbd } from '@/shared/ui/kbd';

const initialFormState: FormState = {
    summary: '',
    colorId: '1',
    start: '08:00',
    end: '12:00',
    allDay: false
};
export function AddEventForm({ date }: { date: Date }) {
    const [form, setForm] = useState<FormState>(initialFormState);

    const resetForm = () => setForm(initialFormState);
    const updateForm = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((prev) => ({ ...prev, [key]: value }));

    const { addEvent } = useAddEvent();

    const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!form.summary.trim()) {
            toast.warning('일정 제목을 입력해주세요');
            return;
        }
        addEvent({ date, ...form });
        trackEvent('AddEvent');
        const desc = form.allDay ? '하루 종일 일정으로 추가되었습니다.' : `${form.start} - ${form.end}에 일정이 추가되었습니다.`;
        toast.success(`"${form.summary}" 일정이 추가되었습니다`, {
            description: `${date.toLocaleDateString()} ${desc}`
        });
        resetForm();
    };

    return (
        <EventForm
            form={form}
            updateForm={updateForm}
            onSubmit={handleSubmit}
            type="add"
            trigger={
                <button
                    className="text-secondary mt-2 w-full rounded-xl border-2 border-dashed py-3 text-center"
                    onClick={() => {
                        resetForm();
                    }}
                >
                    일정 추가
                    <Kbd className="ml-2">Ctrl + ⏎</Kbd>
                </button>
            }
        />
    );
}
