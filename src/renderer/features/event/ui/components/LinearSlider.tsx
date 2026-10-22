import { useRef, useState, useCallback, useEffect } from 'react';
import { AlarmClock, AlarmClockOff, ArrowRight, Minus, Plus } from 'lucide-react';
import { FormState } from '../../types/FormType';

const MAX_TIME = 23 * 60 + 55; // 23:55
const MINUTES_IN_DAY = 1440;
const PREFERRED_GAP = 120; // 선호하는 기본 간격 (2시간)

interface SliderProps {
  updateForm: (key: keyof FormState, value: FormState[keyof FormState]) => void;
  defaultTime?: [string, string];
  startDate: string;
  endDate: string;
}

export function LinearSlider({ updateForm, defaultTime = ['08:00', '12:00'], startDate, endDate }: SliderProps) {
  // 여러 날에 걸친 일정이면 시작/종료가 서로 다른 날의 시각이라 제약을 풀고 레인을 둘로 나눔
  const allowCrossDay = endDate > startDate;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeThumb, setActiveThumb] = useState<'start' | 'end' | null>(null);
  const [start, setStart] = useState(timeToMinutes(defaultTime[0]));
  const [end, setEnd] = useState(timeToMinutes(defaultTime[1]));

  const handleUpdate = useCallback(
    (newStart: number, newEnd: number) => {
      const safeStart = Math.max(0, Math.min(newStart, MAX_TIME));
      let safeEnd = Math.max(0, Math.min(newEnd, MAX_TIME));

      if (!allowCrossDay) {
        if (newStart !== start) {
          if (safeStart + PREFERRED_GAP <= MAX_TIME) {
            safeEnd = Math.max(safeEnd, safeStart + PREFERRED_GAP);
          } else {
            safeEnd = MAX_TIME;
          }
        }
        safeEnd = Math.max(safeEnd, safeStart);
      }

      setStart(safeStart);
      setEnd(safeEnd);
      updateForm('start', minutesToTime(safeStart));
      updateForm('end', minutesToTime(safeEnd));
    },
    [start, updateForm, allowCrossDay]
  );

  // 여러 날 → 하루로 돌아왔는데 종료가 시작보다 앞서 있으면 기본 간격으로 밀어줌
  useEffect(() => {
    if (!allowCrossDay && end < start) handleUpdate(start, start + PREFERRED_GAP);
  }, [allowCrossDay, start, end, handleUpdate]);

  const adjustTime = (type: 'start' | 'end', amount: number) => {
    if (type === 'start') {
      handleUpdate(start + amount, end);
    } else if (type === 'end') {
      const nextEnd = allowCrossDay ? end + amount : Math.max(start, end + amount);
      handleUpdate(start, nextEnd);
    }
  };

  const positionToMinutes = (x: number) => {
    if (!sliderRef.current) {
      return 0;
    }
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min((x - rect.left) / rect.width, 1));
    const minutes = Math.min(ratio * MINUTES_IN_DAY, MAX_TIME);
    return Math.round(minutes / 5) * 5;
  };

  const handleDrag = (thumb: 'start' | 'end', e: React.PointerEvent) => {
    e.preventDefault();
    setActiveThumb(thumb);

    const move = (moveEvent: PointerEvent) => {
      const minutes = positionToMinutes(moveEvent.clientX);
      if (thumb === 'start') {
        handleUpdate(minutes, end);
      } else {
        handleUpdate(start, minutes);
      }
    };

    const up = () => {
      setActiveThumb(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex">
        <div className="flex w-10 shrink-0 flex-col justify-between">
          {allowCrossDay ? (
            <>
              <LaneLabel kind="시작" />
              <LaneLabel kind="종료" />
            </>
          ) : (
            <LaneLabel kind="시간" />
          )}
        </div>
        <div className={`relative flex-1 ${allowCrossDay ? 'h-14' : 'h-9.5'}`}>
          <div ref={sliderRef} className="absolute h-4 w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />
          {allowCrossDay && <div className="absolute top-10 h-4 w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />}

          {allowCrossDay ? (
            <>
              <SliderFill left={start} width={MINUTES_IN_DAY - start} className="rounded-r-full" />
              <SliderFill left={0} width={end} className="top-10 rounded-l-full" />
              <LaneRuler className="bottom-10" covered={(h) => h * 60 >= start} />
              <LaneRuler className="top-10" covered={(h) => h * 60 <= end} />
            </>
          ) : (
            <>
              <SliderFill left={start} width={end - start} />
              <LaneRuler className="bottom-5.5" covered={(h) => h * 60 >= start && h * 60 <= end} />
            </>
          )}

          {Array.from({ length: 9 }, (_, i) => i * 3).map((h) => {
            const isMajor = h % 6 === 0;
            const hh = h.toString().padStart(2, '0');
            return (
              <div key={h} className="absolute top-5.5 flex flex-col" style={{ left: `${(h / 24) * 100}%` }}>
                <span className={`-ml-1.5 tabular-nums ${isMajor ? 'text-xs font-medium text-zinc-500' : 'text-[10px] text-zinc-400 dark:text-zinc-500'}`}>{hh}</span>
              </div>
            );
          })}

          <SliderThumb
            type="start"
            pos={(start / MINUTES_IN_DAY) * 100}
            active={activeThumb === 'start'}
            onPointerDown={(e) => handleDrag('start', e)}
            className={`${activeThumb === 'start' ? 'z-40' : start > MAX_TIME - 30 ? 'z-35' : 'z-20'}`}
          />
          <SliderThumb
            type="end"
            pos={(end / MINUTES_IN_DAY) * 100}
            active={activeThumb === 'end'}
            onPointerDown={(e) => handleDrag('end', e)}
            className={`${allowCrossDay ? 'top-12' : ''} ${activeThumb === 'end' ? 'z-40' : end < 30 ? 'z-35' : 'z-25'}`}
          />
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        <TimeStepperButton label="시작시간" value={minutesToTime(start)} onClick={(amt) => adjustTime('start', amt)} />
        <ArrowRight className="mt-5 h-4 w-4 text-zinc-800" />
        <TimeStepperButton label="종료시간" value={minutesToTime(end)} onClick={(amt) => adjustTime('end', amt)} />
      </div>
    </div>
  );
}

function LaneLabel({ kind }: { kind: string }) {
  return <span className="text-secondary flex h-4 items-center text-sm font-medium select-none">{kind}</span>;
}

function LaneRuler({ className, covered }: { className: string; covered: (hour: number) => boolean }) {
  return (
    <>
      {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => {
        const size = h % 6 === 0 ? 'h-2 w-[1.5px]' : h % 3 === 0 ? 'h-2 w-px' : 'h-1 w-px';
        return (
          <div
            key={h}
            className={`pointer-events-none absolute z-15 -translate-x-1/2 ${size} ${covered(h) ? 'bg-white/85' : 'bg-zinc-400 dark:bg-zinc-500'} ${className}`}
            style={{ left: `${(h / 24) * 100}%` }}
          />
        );
      })}
    </>
  );
}

function SliderFill({ left, width, className = '' }: { left: number; width: number; className?: string }) {
  return <div className={`absolute z-10 h-4 bg-(--event-color) dark:saturate-70 ${className}`} style={{ left: `${(left / MINUTES_IN_DAY) * 100}%`, width: `${(width / MINUTES_IN_DAY) * 100}%` }} />;
}

function SliderThumb({
  type,
  pos,
  active,
  onPointerDown,
  className = ''
}: {
  type: 'start' | 'end';
  pos: number;
  active: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  className?: string;
}) {
  const Icon = type === 'start' ? AlarmClock : AlarmClockOff;
  return (
    <div
      onPointerDown={onPointerDown}
      className={`absolute top-2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-(--event-color) p-1.5 transition-transform duration-150 active:cursor-grabbing ${active ? 'scale-125' : ''} ${className}`}
      style={{ left: `${pos}%` }}
    >
      <Icon className="text-white" size={16} />
    </div>
  );
}

function TimeStepperButton({ label, value, onClick }: { label: string; value: string; onClick: (value: number) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 select-none">
      <span className="text-xs font-semibold text-zinc-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onClick(-5)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-(--event-color) active:bg-(--event-color) active:text-white dark:bg-zinc-800 dark:text-zinc-400"
        >
          <Minus size={12} />
        </button>
        <div className="min-w-20 rounded-xl border border-zinc-100 bg-white py-1.5 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-md font-semibold text-zinc-500 tabular-nums dark:text-zinc-300">{value}</span>
        </div>
        <button
          type="button"
          onClick={() => onClick(5)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-(--event-color) active:bg-(--event-color) active:text-white dark:bg-zinc-800 dark:text-zinc-400"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
