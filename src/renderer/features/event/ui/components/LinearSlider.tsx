import { useRef, useState, useCallback } from 'react';
import { AlarmClock, AlarmClockOff, ArrowRight, Minus, Plus } from 'lucide-react';
import { FormState } from '../../types/FormType';

const MAX_TIME = 23 * 60 + 55; // 23:55
const MINUTES_IN_DAY = 1440;
const PREFERRED_GAP = 120; // 선호하는 기본 간격 (2시간)

interface SliderProps {
    updateForm: (key: keyof FormState, value: FormState[keyof FormState]) => void;
    defaultTime?: [string, string];
}

export function LinearSlider({ updateForm, defaultTime = ['08:00', '12:00'] }: SliderProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [activeThumb, setActiveThumb] = useState<'start' | 'end' | null>(null);
    const [start, setStart] = useState(timeToMinutes(defaultTime[0]));
    const [end, setEnd] = useState(timeToMinutes(defaultTime[1]));

    const handleUpdate = useCallback(
        (newStart: number, newEnd: number) => {
            const safeStart = Math.max(0, Math.min(newStart, MAX_TIME));
            let safeEnd = newEnd;

            if (newStart !== start) {
                if (safeStart + PREFERRED_GAP <= MAX_TIME) {
                    safeEnd = Math.max(newEnd, safeStart + PREFERRED_GAP);
                } else {
                    safeEnd = MAX_TIME;
                }
            }

            const finalEnd = Math.max(safeEnd, safeStart);

            setStart(safeStart);
            setEnd(Math.min(finalEnd, MAX_TIME));
            updateForm('start', minutesToTime(safeStart));
            updateForm('end', minutesToTime(Math.min(finalEnd, MAX_TIME)));
        },
        [start, updateForm]
    );

    const adjustTime = (type: 'start' | 'end', amount: number) => {
        if (type === 'start') {
            handleUpdate(start + amount, end);
        } else if (type === 'end') {
            const nextEnd = Math.max(start, end + amount);
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
            <div className="relative mb-6 h-6">
                <div ref={sliderRef} className="absolute h-6 w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />

                <div
                    className="absolute z-10 h-6 bg-(--event-color) dark:saturate-70"
                    style={{
                        left: `${(start / MINUTES_IN_DAY) * 100}%`,
                        width: `${((end - start) / MINUTES_IN_DAY) * 100}%`,
                        backgroundImage: 'radial-gradient(circle, white 1.2px, transparent 1.2px)',
                        backgroundSize: '8px 100%',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'repeat-x'
                    }}
                />

                {['00', '06', '12', '18', '24'].map((h) => (
                    <div key={h} className="absolute mt-2 -ml-2 flex flex-col items-center" style={{ left: `${(parseInt(h) / 24) * 100}%` }}>
                        <div className="mb-3 h-2 w-px bg-zinc-400" />
                        <span className="text-xs font-medium text-zinc-500">{h}</span>
                    </div>
                ))}

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
                    className={`${activeThumb === 'end' ? 'z-40' : end < 30 ? 'z-35' : 'z-25'}`}
                />
            </div>

            <div className="flex w-full items-center justify-between gap-2">
                <TimeStepperButton label="시작시간" value={minutesToTime(start)} onClick={(amt) => adjustTime('start', amt)} />
                <ArrowRight className="mt-5 h-4 w-4 text-zinc-800" />
                <TimeStepperButton label="종료시간" value={minutesToTime(end)} onClick={(amt) => adjustTime('end', amt)} />
            </div>
        </div>
    );
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
            className={`absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-(--event-color) p-1.5 transition-transform duration-150 active:cursor-grabbing ${active ? 'scale-125' : ''} ${className}`}
            style={{ left: `${pos}%` }}
        >
            <Icon className="text-white" size={16} />
        </div>
    );
}

function TimeStepperButton({ label, value, onClick }: { label: string; value: string; onClick: (value: number) => void }) {
    return (
        <div className="flex flex-1 flex-col items-center gap-2 select-none">
            <span className="text-xs font-semibold tracking-wider text-zinc-400">{label}</span>
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onClick(-5)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-(--event-color) active:bg-(--event-color) active:text-white dark:bg-zinc-800 dark:text-zinc-400"
                >
                    <Minus size={12} />
                </button>
                <div className="min-w-20 rounded-xl border border-zinc-100 bg-white py-1.5 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <span className="text-lg font-bold text-(--event-color) tabular-nums">{value}</span>
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
