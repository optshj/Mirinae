import { useEffect, useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';

import { HangulInput } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { COLORPALLETTE } from '@/shared/const/color';

import { LinearSlider } from './LinearSlider';
import { FormState } from '../../types/FormType';

interface EventFormProps {
    form: FormState;
    updateForm: (key: keyof FormState, value: FormState[keyof FormState]) => void;
    onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
    trigger: React.ReactNode;
    type: 'add' | 'edit';
}

export function EventForm({ form, updateForm, onSubmit, trigger, type }: EventFormProps) {
    const formId = `${type}-event-form`;
    const submitButtonText = type === 'add' ? '추가' : '수정';
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                if (showForm) {
                    e.preventDefault();
                    onSubmit();
                    setShowForm(false);
                    return;
                }
                if (document.getElementById('edit-event-form')) {
                    return;
                }
                if (type === 'add') {
                    setShowForm(true);
                    return;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForm, form, onSubmit, type]);

    return (
        <>
            {showForm ? (
                <form onSubmit={onSubmit} className={`flex flex-col gap-4 rounded-xl border p-4 dark:saturate-70 event-color-${form.colorId} border-(--event-color)`} id={formId}>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="summary" className={`event-color-${form.colorId} text-(--event-color)`}>
                            일정 제목
                        </label>
                        <HangulInput
                            id="summary"
                            placeholder="일정을 입력해주세요"
                            className={`text-primary event-color-${form.colorId} w-full rounded-lg border border-(--event-color) py-2 pr-20 pl-3 focus:ring-0 focus:outline-none dark:saturate-70`}
                            type="text"
                            value={form.summary}
                            onChange={(newSummary) => updateForm('summary', newSummary)}
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={`event-color-${form.colorId} text-(--event-color)`}>하루종일</span>
                        <Switch onClick={() => updateForm('allDay', !form.allDay)} isOn={form.allDay} />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className={`event-color-${form.colorId} text-(--event-color)`}>시간 설정</label>
                        </div>

                        <div className="-50 relative flex flex-col items-center justify-center p-4">
                            <LinearSlider updateForm={updateForm} colorId={form.colorId} defaultTime={[form.start, form.end]} disabled={form.allDay} />

                            {!form.allDay && (
                                <div className="mt-4 flex w-full items-center justify-around px-10">
                                    <div className="flex flex-1 flex-col items-center">
                                        <span className="mb-1 text-xs tracking-wider text-zinc-400 uppercase">시작시간</span>
                                        <div className={`w-full max-w-[100px] rounded-xl border border-zinc-100 bg-white px-3 py-1 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-800`}>
                                            <span className={`text-lg font-bold event-color-${form.colorId} text-(--event-color)`}>{form.start}</span>
                                        </div>
                                    </div>

                                    {/* 연결 화살표 */}
                                    <div className="flex px-4 pt-4">
                                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                                    </div>

                                    {/* 종료 시간 박스 */}
                                    <div className="flex flex-1 flex-col items-center">
                                        <span className="mb-1 text-xs tracking-wider text-zinc-400 uppercase">종료시간</span>
                                        <div className={`w-full max-w-[100px] rounded-xl border border-zinc-100 bg-white px-3 py-1 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-800`}>
                                            <span className={`text-lg font-bold event-color-${form.colorId} text-(--event-color)`}>{form.end}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/** 컬러 팔레트 */}
                    <div className="grid grid-cols-6 gap-2 px-2">
                        {COLORPALLETTE.map((key) => (
                            <div
                                key={key}
                                className={`flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-150 dark:saturate-70 event-color-${key} bg-(--event-color)`}
                                onClick={() => updateForm('colorId', key)}
                            >
                                {form.colorId === key && <Check className="text-white" strokeWidth={3} size={16} />}
                            </div>
                        ))}
                    </div>

                    {/** 버튼 */}
                    <div className="flex items-center justify-end gap-2">
                        <button type="button" className="rounded-lg border border-zinc-300 bg-zinc-100 px-6 py-1.5 font-semibold text-zinc-500" onClick={() => setShowForm(false)}>
                            취소
                        </button>
                        <button type="submit" className={`rounded-lg px-6 py-1.5 font-semibold text-white dark:saturate-70 event-color-${form.colorId} bg-(--event-color)`}>
                            {submitButtonText}
                        </button>
                    </div>
                </form>
            ) : (
                <div onClick={() => setShowForm(true)}>{trigger}</div>
            )}
        </>
    );
}
