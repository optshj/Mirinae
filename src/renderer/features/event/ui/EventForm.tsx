import { Check, ArrowRight } from 'lucide-react';
import HangulInput from '@/shared/ui/HangulInput';
import { LinearSlider } from './LinearSlider';
import { FormState } from '../types/FormType';

interface EventFormFieldsProps {
    form: FormState;
    updateForm: (key: keyof FormState, value: FormState[keyof FormState]) => void;
    onCancel: () => void;
    onSubmitText: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    id?: string;
}
export function EventForm({ form, updateForm, onCancel, onSubmit, onSubmitText, id }: EventFormFieldsProps) {
    return (
        <form onSubmit={onSubmit} className={`flex flex-col gap-4 rounded-xl border p-4 dark:saturate-70 event-color-${form.colorId} border-(--event-color)`} id={id}>
            <div className="flex flex-col gap-1">
                <label htmlFor="summary" className={`event-color-${form.colorId} text-(--event-color)`}>
                    일정 제목
                </label>
                <HangulInput
                    id="summary"
                    placeholder="일정을 입력해주세요"
                    className="text-primary event-color-${form.colorId} w-full rounded-lg border border-(--event-color) py-2 pr-20 pl-3 focus:ring-0 focus:outline-none dark:saturate-70"
                    type="text"
                    value={form.summary}
                    onChange={(newSummary) => updateForm('summary', newSummary)}
                    autoFocus
                />
            </div>

            {/** 하루종일 스위치 */}
            <div className="flex items-center gap-4">
                <span className={`event-color-${form.colorId} text-(--event-color)`}>하루종일</span>
                <button
                    type="button"
                    onClick={() => {
                        updateForm('allDay', !form.allDay);
                    }}
                    onKeyDown={(e) => e.preventDefault()}
                    className={`border-background-secondary relative flex h-6 w-12 items-center justify-center rounded-full transition-colors duration-300 ${form.allDay ? 'bg-green-500' : 'bg-zinc-400'}`}
                >
                    <div className={`absolute h-5 w-5 rounded-full bg-white p-1 transition-all duration-300 ${form.allDay ? 'translate-x-3' : '-translate-x-3'} `} />
                </button>
            </div>

            {/** 시간 선택: 하루종일이면 숨김 */}
            <div>
                <label className={`event-color-${form.colorId} text-(--event-color)`}>시간 선택</label>
                <div className="relative flex flex-col items-center justify-center">
                    <LinearSlider updateForm={updateForm} colorId={form.colorId} defaultTime={[form.start, form.end]} disabled={form.allDay} />
                    {!form.allDay && (
                        <div className="flex w-full justify-between px-24">
                            <div className="flex flex-col items-center">
                                <span className="text-md text-secondary">시작</span>
                                <span className={`w-[52px] text-center text-lg font-bold event-color-${form.colorId} text-(--event-color)`}>{form.start}</span>
                            </div>

                            <ArrowRight className="text-primary mt-2 h-5 w-5" />

                            <div className="flex flex-col items-center">
                                <span className="text-md text-secondary">종료</span>
                                <span className={`event-color-${form.colorId} w-[52px] text-center text-lg font-bold text-(--event-color)`}>{form.end}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/** 컬러 팔레트 */}
            <div className="grid grid-cols-6 gap-2 px-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map((key) => (
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
                <button type="button" className="rounded-lg border border-zinc-300 bg-zinc-100 px-6 py-1.5 font-semibold text-zinc-500" onClick={onCancel}>
                    취소
                </button>
                <button type="submit" className={`rounded-lg px-6 py-1.5 font-semibold text-white dark:saturate-70 event-color-${form.colorId} bg-(--event-color)`}>
                    {onSubmitText}
                </button>
            </div>
        </form>
    );
}
