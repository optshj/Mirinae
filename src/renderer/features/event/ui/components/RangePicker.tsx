import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface RangePickerProps {
  start: string;
  end: string;
  onChange: (end: string) => void;
}

export function RangePicker({ start, end, onChange }: RangePickerProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false); // 닫힘 애니메이션 동안 DOM 유지
  const [viewMonth, setViewMonth] = useState(() => dayjs(start).startOf('month'));
  const [hover, setHover] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setViewMonth(dayjs(start).startOf('month')), [start, open]);

  // open이 꺼지면 퇴장 애니메이션(150ms) 후에 언마운트
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

  // 표시할 범위: 호버 중이면 시작~호버 미리보기, 아니면 시작~종료
  const rangeEnd = hover && hover >= start ? hover : end;

  const handleDayClick = (day: string) => {
    if (day < start) return; // 시작일 이전은 선택 불가
    onChange(day); // 선택해도 닫지 않음 — 바깥 클릭 시에만 닫힘
  };

  const label = start === end ? dayjs(start).format('M월 D일 (dd)') : `${dayjs(start).format('M월 D일 (dd)')} ~ ${dayjs(end).format('M월 D일 (dd)')}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
          open ? 'text-primary border-(--event-color) bg-zinc-50 dark:bg-zinc-800' : 'text-primary border-primary hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="tabular-nums">{label}</span>
      </button>

      {visible && (
        <div
          className={`bg-layer border-primary absolute top-full left-0 z-50 mt-1 origin-top rounded-xl border p-3 shadow-lg ease-out [animation-fill-mode:forwards] ${
            open ? 'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150' : 'animate-out fade-out-0 zoom-out-95 duration-100'
          }`}
          onMouseLeave={() => setHover(null)}
        >
          <div className="relative flex gap-4">
            <button type="button" className="text-secondary hover:text-primary absolute top-0 left-0 z-10 rounded p-1" onClick={() => setViewMonth((m) => m.subtract(1, 'month'))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="text-secondary hover:text-primary absolute top-0 right-0 z-10 rounded p-1" onClick={() => setViewMonth((m) => m.add(1, 'month'))}>
              <ChevronRight className="h-4 w-4" />
            </button>
            <MonthGrid month={viewMonth} start={start} rangeEnd={rangeEnd} onDayClick={handleDayClick} onDayHover={setHover} />
            <MonthGrid month={viewMonth.add(1, 'month')} start={start} rangeEnd={rangeEnd} onDayClick={handleDayClick} onDayHover={setHover} />
          </div>
        </div>
      )}
    </div>
  );
}

interface MonthGridProps {
  month: Dayjs;
  start: string;
  rangeEnd: string;
  onDayClick: (day: string) => void;
  onDayHover: (day: string) => void;
}
function MonthGrid({ month, start, rangeEnd, onDayClick, onDayHover }: MonthGridProps) {
  const gridStart = month.subtract(month.day(), 'day');
  const days = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'));

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
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const ds = day.format('YYYY-MM-DD');
          const inMonth = day.month() === month.month();
          const isStart = ds === start;
          const isEnd = ds === rangeEnd;
          const isEdge = isStart || isEnd;
          const inRange = ds > start && ds < rangeEnd;
          const disabled = ds < start;

          return (
            <div
              key={ds}
              className={`flex h-7 w-7 items-center justify-center ${inRange || isEdge ? 'bg-(--event-color)/15' : ''} ${isStart ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''}`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDayClick(ds)}
                onMouseEnter={() => onDayHover(ds)}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px]/3 tabular-nums transition-colors ${
                  isEdge
                    ? 'bg-(--event-color) font-medium text-white dark:saturate-70'
                    : disabled
                      ? 'cursor-not-allowed text-zinc-300 dark:text-zinc-600'
                      : `${inMonth ? 'text-primary' : 'text-secondary'} hover:bg-zinc-100 dark:hover:bg-zinc-700`
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
