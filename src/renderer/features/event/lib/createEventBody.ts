import dayjs from 'dayjs';

interface EventBodyParams {
    date: Date;
    start: string;
    end: string;
    summary: string;
    colorId: string;
    allDay: boolean;
}

export function createEventBody({ date, start, end, summary, allDay, colorId = '1' }: EventBodyParams) {
    const baseDate = dayjs(date);

    if (allDay) {
        return {
            summary,
            colorId,
            start: { date: baseDate.format('YYYY-MM-DD') },
            end: { date: baseDate.add(1, 'day').format('YYYY-MM-DD') }
        };
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startDateTime = baseDate.hour(startHour).minute(startMin).second(0);
    const endDateTime = baseDate.hour(endHour).minute(endMin).second(0);

    return {
        summary,
        colorId,
        start: { dateTime: startDateTime.format(), timeZone },
        end: { dateTime: endDateTime.format(), timeZone }
    };
}
