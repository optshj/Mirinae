import { formatDateLocal, makeDateTime, toIsoStringWithOffset } from '@/shared/lib/dateFunction';

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
