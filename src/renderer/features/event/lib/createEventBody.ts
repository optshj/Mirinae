interface EventBodyParams {
    date: Date;
    start: string;
    end: string;
    summary: string;
    colorId: string;
    allDay: boolean;
}
export function createEventBody({ date, start, end, summary, allDay, colorId = '1' }: EventBodyParams) {
    if (allDay) {
        const startDate = formatDateLocal(date);
        const endDateObj = new Date(date);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDate = formatDateLocal(endDateObj);

        return {
            summary,
            start: { date: startDate },
            end: { date: endDate },
            colorId: colorId
        };
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDateTime = makeDateTime(date, start);
    const endDateTime = makeDateTime(date, end);

    return {
        summary,
        start: { dateTime: toIsoStringWithOffset(startDateTime), timeZone },
        end: { dateTime: toIsoStringWithOffset(endDateTime), timeZone },
        colorId: colorId
    };
}

export function toIsoStringWithOffset(date: Date) {
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num: number) => {
        const norm = Math.floor(Math.abs(num));
        return (norm < 10 ? '0' : '') + norm;
    };

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());

    const offsetHour = pad(tzo / 60);
    const offsetMinute = pad(tzo % 60);

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${dif}${offsetHour}:${offsetMinute}`;
}

// 예: Date + 09:30 -> 2025-10-01T09:30:00.000+09:00
export function makeDateTime(date: Date, time: string) {
    const [hour, minute] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hour, minute, 0, 0);
    return result;
}

export function formatDateLocal(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
