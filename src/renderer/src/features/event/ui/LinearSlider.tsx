import { AlarmClock, AlarmClockOff } from 'lucide-react'
import { useRef, useState } from 'react'

interface SliderProps {
    updateForm: (key: keyof { startTime: string; endTime: string }, value: string) => void
    color?: string
    defaultTime?: [string, string]
}
export function LinearSlider({ updateForm, color = '#6A91E0', defaultTime = ['08:00', '12:00'] }: SliderProps) {
    const MAX_TIME = 23 * 60 + 55
    const sliderRef = useRef<HTMLDivElement>(null)

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number)
        return h * 60 + m
    }

    const minutesToTime = (minutes: number) => {
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }

    const [start, setStart] = useState(timeToMinutes(defaultTime[0]))
    const [end, setEnd] = useState(timeToMinutes(defaultTime[1]))

    const positionToMinutes = (x: number) => {
        if (!sliderRef.current) return 0
        const rect = sliderRef.current.getBoundingClientRect()
        const pos = Math.max(0, Math.min(x - rect.left, rect.width)) // 바깥 드래그 방지
        const ratio = pos / rect.width
        const minutes = Math.min(ratio * 1440, MAX_TIME)

        return Math.round(minutes / 5) * 5
    }

    const handleDrag = (thumb: 'start' | 'end', e: React.PointerEvent) => {
        e.preventDefault()

        const move = (moveEvent: PointerEvent) => {
            const minutes = positionToMinutes(moveEvent.clientX)

            if (thumb === 'start') {
                const newStart = Math.min(minutes, end) // 종료 시간보다 크면 안 됨
                setStart(newStart)
                updateForm('startTime', minutesToTime(newStart))
            } else {
                const newEnd = Math.max(minutes, start) // 시작 시간보다 작으면 안 됨
                setEnd(newEnd)
                updateForm('endTime', minutesToTime(newEnd))
            }
        }

        const up = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
    }

    return (
        <div className="w-full px-6 py-2">
            <div className="relative h-12 select-none">
                {/* 슬라이더 트랙 */}
                <div ref={sliderRef} className="absolute top-1/2 left-0 h-2 w-full -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-zinc-700" />

                {/* 선택된 구간 */}
                <div
                    className="absolute top-1/2 h-2 rounded-full"
                    style={{
                        left: `${(start / 1440) * 100}%`,
                        width: `${((end - start) / 1440) * 100}%`,
                        background: color,
                        transform: 'translateY(-50%)'
                    }}
                />

                {/* 기준 라벨 (00, 06, 12, 18, 24) */}
                {['00', '06', '12', '18', '24'].map((label, i) => (
                    <div
                        key={label}
                        className="absolute top-4 text-xs text-zinc-500"
                        style={{
                            left: `${((i * 6) / 24) * 100}%`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="mx-auto mb-1 h-4 w-[1px] bg-zinc-400" />
                        {label}
                    </div>
                ))}

                {/* 시작 Thumb */}
                <div
                    onPointerDown={(e) => handleDrag('start', e)}
                    className="text-secondary absolute top-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-300 bg-white p-1 dark:border-zinc-600 dark:bg-[#424242]"
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
                    className="text-secondary absolute top-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-300 bg-white p-1 dark:border-zinc-600 dark:bg-[#424242]"
                    style={{
                        left: `${(end / 1440) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <AlarmClockOff />
                </div>
            </div>
        </div>
    )
}
