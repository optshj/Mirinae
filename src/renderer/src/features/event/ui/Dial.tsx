import { JSX, useRef, useState } from 'react'
import { angleToPosition, angleToTime, timeToAngle, CENTER, describeArc, RADIUS, THUMB_RADIUS } from '../lib/dialFuction'

interface DialProps {
    updateForm: (key: keyof { startTime: string; endTime: string }, value: string) => void
    color: string
    defaultTime?: [string, string]
}
export function Dial({ updateForm, color, defaultTime = ['08:00', '10:00'] }: DialProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [angle1, setAngle1] = useState(timeToAngle(defaultTime[0]))
    const [angle2, setAngle2] = useState(timeToAngle(defaultTime[1]))

    const pos1 = angleToPosition(angle1)
    const pos2 = angleToPosition(angle2)

    // Thumb 드래그 핸들러
    const handleDrag = (thumbNum, e) => {
        e.preventDefault()
        const svg = svgRef.current
        if (!svg) return
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        const cursorpt = pt.matrixTransform(svg.getScreenCTM()!.inverse())
        const dx = cursorpt.x - CENTER
        const dy = cursorpt.y - CENTER
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
        if (angle < 0) angle += 360
        angle = Math.round(angle / 1.25) * 1.25 // 약 5분 단위 절삭

        if (thumbNum === 1) {
            // 시작 시간 Thumb
            setAngle1(angle)
            updateForm('startTime', angleToTime(angle).hour.toString().padStart(2, '0') + ':' + angleToTime(angle).minute.toString().padStart(2, '0'))

            // 종료 시간이 시작 시간보다 작으면 같이 올림
            if (angle2 < angle) {
                setAngle2(angle)
                updateForm('endTime', angleToTime(angle).hour.toString().padStart(2, '0') + ':' + angleToTime(angle).minute.toString().padStart(2, '0'))
            }
        } else {
            // 종료 시간 Thumb
            if (angle < angle1) angle = angle1 // 시작 시간 이하로 못 내림
            setAngle2(angle)
            updateForm('endTime', angleToTime(angle).hour + ':' + angleToTime(angle).minute.toString().padStart(2, '0'))
        }
    }

    // 파란색 호
    const arcPath = describeArc(CENTER, CENTER, RADIUS, angle1, angle2)

    const ARC_STROKE = 12

    /* ==========================
       1. 작은 눈금 (24시간 * 2 = 48개)
       ========================== */
    const smallMarks = Array.from({ length: 48 }, (_, i) => {
        const angle = i * 7.5 - 90 // 360 / 48 = 7.5도
        const rad = (angle * Math.PI) / 180

        let inner = RADIUS - 9
        let outer = RADIUS - 6

        if (i % 4 === 0) {
            inner = RADIUS - 12 // 안쪽으로 조금 더 길게 들어옴
        }

        const x1 = CENTER + inner * Math.cos(rad)
        const y1 = CENTER + inner * Math.sin(rad)
        const x2 = CENTER + outer * Math.cos(rad)
        const y2 = CENTER + outer * Math.sin(rad)

        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#CFCFCF" strokeWidth={i % 2 === 0 ? 2 : 1} />
    })

    /* ==========================
       2. 주요 라벨
       ========================== */
    const mainLabels = [
        { text: '00', angle: -90 },
        { text: '06', angle: 0 },
        { text: '12', angle: 90 },
        { text: '18', angle: 180 }
    ]

    const mainLabelElements = mainLabels.map((label, index) => {
        const rad = (label.angle * Math.PI) / 180
        const labelRadius = RADIUS - 28
        const x = CENTER + labelRadius * Math.cos(rad)
        const y = CENTER + labelRadius * Math.sin(rad)
        return (
            <text key={index} x={x} y={y + 4} textAnchor="middle" fontSize="12" className="fill-primary font-semibold">
                {label.text}
            </text>
        )
    })

    /* ==========================
       3. 짝수 시간 (2,4,8,10 등)
       ========================== */
    const evenHours = [2, 4, 8, 10, 14, 16, 20, 22]
    const evenHourElements = evenHours.map((hour) => {
        const angle = hour * 15 - 90
        const rad = (angle * Math.PI) / 180
        const labelRadius = RADIUS - 22
        const x = CENTER + labelRadius * Math.cos(rad)
        const y = CENTER + labelRadius * Math.sin(rad)
        return (
            <text key={hour} x={x} y={y + 3} textAnchor="middle" fontSize="11" className="fill-primary">
                {hour}
            </text>
        )
    })
    const selectedMarks: JSX.Element[] = []
    const step = 7.5 // 간격 (7.5도 = 30분)

    for (let angle = angle1; angle <= angle2; angle += step) {
        const rad = ((angle - 90) * Math.PI) / 180

        const radius = RADIUS - ARC_STROKE + 11 // 점 위치 (line의 inner+1 정도)
        const x = CENTER + radius * Math.cos(rad)
        const y = CENTER + radius * Math.sin(rad)

        selectedMarks.push(<circle key={`selected-${angle}`} cx={x} cy={y} r={1} fill="#fff" />)
    }

    return (
        <svg width={240} height={240} style={{ background: 'none', userSelect: 'none' }} ref={svgRef}>
            {/* 배경 원 */}
            <circle cx={CENTER} cy={CENTER} r={RADIUS} strokeWidth={ARC_STROKE} fill="none" className="stroke-zinc-200 dark:stroke-zinc-600" />
            {/* 작은 눈금 */}
            {smallMarks}
            {/* 주요 라벨 */}
            {mainLabelElements}
            {/* 짝수 시간 라벨 */}
            {evenHourElements}
            {/* 파란 호 */}
            <path d={arcPath} stroke={color} strokeWidth={ARC_STROKE} fill="none" strokeLinecap="round" className="saturate-70" />

            {/* {selectedMarks} */}
            {/* Thumb 1 */}
            <g data-testid="start-thumb">
                <circle
                    cx={pos1.x}
                    cy={pos1.y}
                    r={THUMB_RADIUS}
                    className="fill-[#fff] stroke-[#E6E8EC] dark:fill-[#424242] dark:stroke-zinc-700"
                    strokeWidth={3}
                    style={{
                        filter: 'drop-shadow(0px 2px 8px rgba(106,145,224,0.18))',
                        cursor: 'pointer'
                    }}
                    onPointerDown={(_e) => {
                        const moveListener = (moveEvent) => handleDrag(1, moveEvent)
                        const upListener = () => {
                            window.removeEventListener('pointermove', moveListener)
                            window.removeEventListener('pointerup', upListener)
                        }
                        window.addEventListener('pointermove', moveListener)
                        window.addEventListener('pointerup', upListener)
                    }}
                />
                <svg
                    x={pos1.x - 8}
                    y={pos1.y - 8}
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: 'none' }}
                >
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2 2" />
                    <path d="M5 3 2 6" />
                    <path d="m22 6-3-3" />
                    <path d="M6.38 18.7 4 21" />
                    <path d="M17.64 18.67 20 21" />
                </svg>
            </g>
            <g data-testid="end-thumb">
                {/* Thumb 2 */}
                <circle
                    cx={pos2.x}
                    cy={pos2.y}
                    r={THUMB_RADIUS}
                    className="fill-[#fff] stroke-[#E6E8EC] dark:fill-[#424242] dark:stroke-zinc-700"
                    strokeWidth={3}
                    style={{
                        filter: 'drop-shadow(0px 2px 8px rgba(106,145,224,0.18))',
                        cursor: 'pointer'
                    }}
                    onPointerDown={(_e) => {
                        const moveListener = (moveEvent) => handleDrag(2, moveEvent)
                        const upListener = () => {
                            window.removeEventListener('pointermove', moveListener)
                            window.removeEventListener('pointerup', upListener)
                        }

                        window.addEventListener('pointermove', moveListener)
                        window.addEventListener('pointerup', upListener)
                    }}
                />
                <svg
                    x={pos2.x - 8}
                    y={pos2.y - 8}
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    style={{ pointerEvents: 'none' }}
                >
                    <path d="M6.87 6.87a8 8 0 1 0 11.26 11.26" />
                    <path d="M19.9 14.25a8 8 0 0 0-9.15-9.15" />
                    <path d="m22 6-3-3" />
                    <path d="M6.26 18.67 4 21" />
                    <path d="m2 2 20 20" />
                    <path d="M4 4 2 6" />
                </svg>
            </g>
        </svg>
    )
}
