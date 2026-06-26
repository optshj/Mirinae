import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

import { HangulInput } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { COLORPALLETTE } from '@/shared/const/color';

import { RangePicker } from './RangePicker';
import { LinearSlider } from './LinearSlider';
import { FormState, RecurrenceType } from '../../types/FormType';

const RECURRENCE_OPTIONS: Array<{ label: string; value: RecurrenceType }> = [
  { label: '반복 안 함', value: null },
  { label: '1일마다', value: 'DAILY' },
  { label: '1주마다', value: 'WEEKLY' },
  { label: '1개월마다', value: 'MONTHLY' },
  { label: '1년마다', value: 'YEARLY' }
];

interface EventFormProps {
  form: FormState;
  updateForm: (key: keyof FormState, value: FormState[keyof FormState]) => void;
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => boolean;
  trigger: React.ReactNode;
  type: 'add' | 'edit';
}

export function EventForm({ form, updateForm, onSubmit, trigger, type }: EventFormProps) {
  const [showForm, setShowForm] = useState(false);
  const formId = `${type}-event-form`;
  const submitButtonText = type === 'add' ? '추가' : '수정';

  // 종료일이 시작일보다 늦으면 여러 날에 걸친 일정 → 슬라이더의 시간 제약을 풀어줌
  const isMultiDay = form.endDate > form.startDate;

  useEffect(() => {
    if (showForm) document.documentElement.classList.add('show-event-form');
    else document.documentElement.classList.remove('show-event-form');
  }, [showForm, formId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        if (showForm) {
          e.preventDefault();
          const isSuccess = onSubmit();
          if (isSuccess) {
            setShowForm(false);
          }
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const isSuccess = onSubmit(e);
    if (isSuccess) {
      setShowForm(false);
    }
  };

  return (
    <>
      {showForm ? (
        <form onSubmit={handleSubmit} className={`mx-auto flex w-full max-w-sm flex-col gap-5 event-color-${form.colorId} dark:saturate-70`} id={formId}>
          <HangulInput
            id="summary"
            placeholder="제목을 입력하세요"
            className={`text-primary w-full border-b py-2 pr-20 text-base font-medium dark:saturate-70`}
            type="text"
            value={form.summary}
            onChange={(newSummary) => updateForm('summary', newSummary)}
            autoFocus
          />

          <div className="flex items-center">
            <span className="text-secondary w-10 shrink-0 text-sm font-medium">날짜</span>
            <RangePicker start={form.startDate} end={form.endDate} onChange={(end) => updateForm('endDate', end)} />
          </div>

          <div className="flex items-center">
            <span className="text-secondary w-10 shrink-0 text-sm font-medium">종일</span>
            <Switch onClick={() => updateForm('allDay', !form.allDay)} isOn={form.allDay} />
          </div>

          <div className={`rounded-xl px-4 pt-3 pb-2 transition-all ${form.allDay ? 'pointer-events-none opacity-50' : ''}`}>
            <LinearSlider updateForm={updateForm} defaultTime={[form.start, form.end]} allowCrossDay={isMultiDay} />
          </div>

          {/** 반복 */}
          <div className="flex items-start">
            <span className="text-secondary w-10 shrink-0 text-sm font-medium">반복</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {RECURRENCE_OPTIONS.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    form.recurrence === value
                      ? 'bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-800'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                  onClick={() => updateForm('recurrence', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/** 색상 */}
          <div className="flex items-start">
            <span className="text-secondary w-10 shrink-0 text-sm font-medium">색상</span>
            <div className="grid grid-cols-6 gap-x-5 gap-y-2">
              {COLORPALLETTE.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110 dark:saturate-70 event-color-${key} bg-(--event-color)`}
                  onClick={() => updateForm('colorId', key)}
                >
                  {form.colorId === key && <Check className="text-white" strokeWidth={3} size={15} />}
                </button>
              ))}
            </div>
          </div>

          {/** 버튼 */}
          <div className="flex items-center justify-end gap-2">
            <button type="button" className="rounded-lg bg-zinc-200 px-6 py-1.5 font-semibold text-zinc-600" onClick={() => setShowForm(false)}>
              취소
            </button>
            <button type="submit" className={`rounded-lg bg-zinc-700 px-6 py-1.5 font-semibold text-white dark:saturate-70`}>
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
