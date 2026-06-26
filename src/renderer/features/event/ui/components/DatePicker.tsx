import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string; // 이 날짜 이전은 선택 불가
  align?: 'left' | 'right'; // 팝업이 펼쳐질 방향
}

export function DatePicker({ value, onChange, min, align = 'left' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false); // 닫힘 애니메이션 동안 DOM 유지
  const [viewMonth, setViewMonth] = useState(() => dayjs(value).startOf('month'));
  const ref = useRef<HTMLDivElement>(null);

  // 팝업을 열 때 선택된 날짜의 월로 이동
  useEffect(() => {
    if (open) setViewMonth(dayjs(value).startOf('month'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // open이 꺼지면 퇴장 애니메이션(100ms) 후에 언마운트
  useEffect(() => {
    if (open) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(false), 100);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const handleDayClick = (day: string) => {
    if (min && day < min) return;
    onChange(day);
    setOpen(false);
  };

  const label = dayjs(value).format('M월 D일 (dd)');

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-9 w-full cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
          open ? 'text-primary border-(--event-color) bg-zinc-50 dark:bg-zinc-800' : 'text-primary border hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="tabular-nums">{label}</span>
      </button>

      {visible && (
        <div
          className={`bg-layer border-primary fill-mode-[forwards] absolute top-full z-50 mt-1 origin-top rounded-xl border p-3 shadow-lg ease-out ${align === 'right' ? 'right-0' : 'left-0'} ${
            open ? 'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150' : 'animate-out fade-out-0 zoom-out-95 duration-100'
          }`}
        >
          <div className="relative">
            <button type="button" className="text-secondary hover:text-primary absolute top-0 left-0 z-10 rounded p-1" onClick={() => setViewMonth((m) => m.subtract(1, 'month'))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="text-secondary hover:text-primary absolute top-0 right-0 z-10 rounded p-1" onClick={() => setViewMonth((m) => m.add(1, 'month'))}>
              <ChevronRight className="h-4 w-4" />
            </button>
            <MonthGrid month={viewMonth} value={value} min={min} onDayClick={handleDayClick} />
          </div>
        </div>
      )}
    </div>
  );
}

interface MonthGridProps {
  month: Dayjs;
  value: string;
  min?: string;
  onDayClick: (day: string) => void;
}
function MonthGrid({ month, value, min, onDayClick }: MonthGridProps) {
  const gridStart = month.subtract(month.day(), 'day');
  const days = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'));
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div className="w-49">
      <div className="text-primary mb-2 text-center text-sm font-medium">{month.format('YYYY년 M월')}</div>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-zinc-400">
        <span className="text-red-400">일</span>
        {['월', '화', '수', '목', '금'].map((d) => (
          <span key={d}>{d}</span>
        ))}
        <span className="text-blue-400"> 토</span>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const ds = day.format('YYYY-MM-DD');
          const inMonth = day.month() === month.month();
          const isSelected = ds === value;
          const isToday = ds === today;
          const disabled = min !== undefined && ds < min;

          return (
            <div key={ds} className="flex h-7 w-7 items-center justify-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDayClick(ds)}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px]/3 tabular-nums transition-colors ${
                  isSelected
                    ? 'bg-(--event-color) font-medium text-white dark:saturate-70'
                    : disabled
                      ? 'cursor-not-allowed text-zinc-300 dark:text-zinc-600'
                      : `${inMonth ? 'text-primary' : 'text-secondary'} ${isToday ? 'ring-1 ring-(--event-color)/50 ring-inset' : ''} hover:bg-zinc-100 dark:hover:bg-zinc-700`
                }`}
              >
                {day.date()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
