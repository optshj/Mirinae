import { AlarmClock, AlarmClockOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { FormState } from '../types/FormType';

interface SliderProps {
    updateForm: (key: keyof FormState, value: FormState[keyof FormState]) => void;
    colorId?: string;
    defaultTime?: [string, string];
    disabled?: boolean;
}
export function LinearSlider({ updateForm, colorId = '1', defaultTime = ['08:00', '12:00'], disabled = false }: SliderProps) {
    const MAX_TIME = 23 * 60 + 55;
    const sliderRef = useRef<HTMLDivElement>(null);

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const minutesToTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const [start, setStart] = useState(timeToMinutes(defaultTime[0]));
    const [end, setEnd] = useState(timeToMinutes(defaultTime[1]));

    const positionToMinutes = (x: number) => {
        if (!sliderRef.current) {
            return 0;
        }
        const rect = sliderRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(x - rect.left, rect.width));
        const ratio = pos / rect.width;
        const minutes = Math.min(ratio * 1440, MAX_TIME);
        return Math.round(minutes / 5) * 5;
    };

    const handleDrag = (thumb: 'start' | 'end', e: React.PointerEvent) => {
        if (disabled) {
            return;
        } // 비활성화 시 동작 막기
        e.preventDefault();

        const move = (moveEvent: PointerEvent) => {
            const minutes = positionToMinutes(moveEvent.clientX);

            if (thumb === 'start') {
                const newStart = Math.min(minutes, end);
                setStart(newStart);
                updateForm('start', minutesToTime(newStart));
            } else {
                const newEnd = Math.max(minutes, start);
                setEnd(newEnd);
                updateForm('end', minutesToTime(newEnd));
            }
        };

        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    return (
        <div className="w-full px-6 py-2">
            <div className="relative h-12 select-none">
                {/* 슬라이더 트랙 */}
                <div
                    ref={sliderRef}
                    className={`absolute top-1/2 left-0 h-2 w-full -translate-y-1/2 rounded-full ${disabled ? 'bg-zinc-300 opacity-60 dark:bg-zinc-800' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                />

                {/* 선택된 구간 */}
                <div
                    className={`absolute top-1/2 h-2 rounded-full ${disabled ? 'opacity-40' : ''} event-color-${colorId} bg-(--event-color)`}
                    style={{
                        left: `${(start / 1440) * 100}%`,
                        width: `${((end - start) / 1440) * 100}%`,
                        transform: 'translateY(-50%)'
                    }}
                />

                {/* 기준 라벨 */}
                {['00', '06', '12', '18', '24'].map((label, i) => (
                    <div
                        key={label}
                        className={`absolute top-4 text-xs ${disabled ? 'text-zinc-400' : 'text-zinc-500'}`}
                        style={{
                            left: `${((i * 6) / 24) * 100}%`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className={`mx-auto mb-1 h-4 w-px ${disabled ? 'bg-zinc-500' : 'bg-zinc-400'}`} />
                        {label}
                    </div>
                ))}

                {/* 시작 Thumb */}
                <div
                    onPointerDown={(e) => handleDrag('start', e)}
                    className={`absolute top-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 p-1 ${
                        disabled ? 'border-zinc-400 bg-zinc-200 opacity-60 dark:border-zinc-600 dark:bg-zinc-700' : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-[#424242]'
                    }`}
                    style={{
                        left: `${(start / 1440) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <AlarmClock />
                </div>

                {/* 종료 Thumb */}
                <div
                    onPointerDown={(e) => handleDrag('end', e)}
                    className={`absolute top-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 p-1 ${
                        disabled ? 'border-zinc-400 bg-zinc-200 opacity-60 dark:border-zinc-600 dark:bg-zinc-700' : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-[#424242]'
                    }`}
                    style={{
                        left: `${(end / 1440) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <AlarmClockOff />
                </div>
            </div>
        </div>
    );
}
