export const RADIUS = 96
export const CENTER = 120
export const THUMB_RADIUS = 14

export function angleToPosition(angle) {
    const rad = (angle - 90) * (Math.PI / 180)
    return {
        x: CENTER + RADIUS * Math.cos(rad),
        y: CENTER + RADIUS * Math.sin(rad)
    }
}
export function timeToAngle(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    const angle = hours * 15 + minutes * 0.25
    return angle % 360
}

export function angleToTime(angle: number) {
    let hour = Math.floor(angle / 15) % 24
    let minute = Math.round(((angle % 15) * 4) / 5) * 5
    if (minute === 60) {
        minute = 0
        hour = (hour + 1) % 24
    }
    return { hour, minute }
}

export function polarToCartesian(cx, cy, r, angle) {
    const a = ((angle - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

export function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, startAngle)
    const end = polarToCartesian(cx, cy, r, endAngle)
    const sweep = (endAngle - startAngle + 360) % 360
    const largeArcFlag = sweep > 180 ? 1 : 0
    return [`M ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`].join(' ')
}
