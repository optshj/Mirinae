export function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

//2025-09-17T18:00:00+09:00 -> 18:00
export function ISO8601toSimpleTime(isoString: string) {
    const date = new Date(isoString)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const paddedMinutes = String(minutes).padStart(2, '0')
    return `${hours}:${paddedMinutes}`
}

// 예시: YYYY-MM-DD HH:mm 형식
export function formatDate(date: Date) {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 예시 8:00 AM
export function formatDateTime(date: { date?: string; dateTime?: string; timeZone?: string }) {
    if (!date.dateTime) return null
    const d = new Date(date.dateTime)
    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit', // 분 표시 (두 자리 / 예: 08:00)
        hour12: true, // 12시간제 AM/PM
        timeZone: date.timeZone || 'UTC' // 기본 timezone 처리
    })

    return formatter.format(d)
}

// 예시 8월 31일 (일) 오전 9:00
export function formatKoreanDateTime(dateStr: string): string {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '' // 잘못된 날짜 처리

    const now = new Date()
    const currentYear = now.getFullYear()

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]

    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const isAm = hours < 12

    const period = isAm ? '오전' : '오후'
    if (hours === 0) hours = 12
    else if (hours > 12) hours -= 12

    // 올해가 아니면 연도 붙이기
    const yearPrefix = year !== currentYear ? `${year}년 ` : ''

    return `${yearPrefix}${month}월 ${day}일 (${weekday}) ${period} ${hours}:${minutes}`
}

// 예: 2025-09-30 → "9월 30일 (화)"
export function formatKoreanDate(dateStr: string): string {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''

    const month = date.getMonth() + 1
    const day = date.getDate()

    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]

    return `${month}월 ${day}일 (${weekday})`
}

// 예: Date + 09:30 -> 2025-10-01T09:30:00.000+09:00
export function makeDateTime(date: Date, time: string) {
    const [hour, minute] = time.split(':').map(Number)
    const result = new Date(date)
    result.setHours(hour, minute, 0, 0)
    return result
}

export function formatDateLocal(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
