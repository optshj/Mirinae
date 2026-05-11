import dayjs from 'dayjs';
import { CalendarEvent } from '@/shared/types/EventType';

export type EventSegment = {
  event: CalendarEvent;
  start: string; // YYYY-MM-DD (clipped to week)
  end: string; // YYYY-MM-DD inclusive (clipped to week)
  isStart: boolean;
  isEnd: boolean;
  lane: number;
};

export function getEventRange(event: CalendarEvent): [string, string] {
  if (event.category === 'time') {
    const startDate = event.start.dateTime.split('T')[0];
    const endDate = event.end.dateTime.split('T')[0];
    return [startDate, endDate < startDate ? startDate : endDate];
  }

  // allDay / holiday: Google API의 end.date는 exclusive(종료일+1)이므로 1일 빼줌
  const startDate = event.start.date;
  const googleExclusiveDate = event.end.date || startDate;
  const endDate = dayjs(googleExclusiveDate).subtract(1, 'day').format('YYYY-MM-DD');

  return [startDate, endDate < startDate ? startDate : endDate];
}

function getEventDuration(event: CalendarEvent) {
  const [start, end] = getEventRange(event);
  return dayjs(end).diff(start, 'day');
}

export function buildWeekSegments(events: CalendarEvent[], weekStart: string, weekEnd: string, maxLanes: number) {
  // 1. 이번 주 범위에 걸쳐 있는 이벤트들만 필터링하고 주 단위로 자름(clipping)
  const segmentsInWeek = events.flatMap((event) => {
    const [fullStart, fullEnd] = getEventRange(event);
    const start = fullStart < weekStart ? weekStart : fullStart;
    const end = fullEnd > weekEnd ? weekEnd : fullEnd;
    if (start > end) return [];
    return [{ event, start, end, isStart: start === fullStart, isEnd: end === fullEnd }];
  });

  // 2. 정렬 규칙: 시작일 빠른 순 -> 기간 긴 순 -> 휴일 우선
  segmentsInWeek.sort((a, b) => {
    if (a.start !== b.start) return a.start.localeCompare(b.start);

    const durationA = getEventDuration(a.event);
    const durationB = getEventDuration(b.event);
    if (durationA !== durationB) return durationB - durationA;

    if (a.event.category === 'holiday' && b.event.category !== 'holiday') return -1;
    if (b.event.category === 'holiday' && a.event.category !== 'holiday') return 1;

    return 0;
  });

  // 3. 겹치지 않게 '차선(lane)' 배정 (Greedy Algorithm)
  const laneEndDates: string[] = []; // 각 차선별로 마지막 일정이 끝나는 날짜 저장

  const segments = segmentsInWeek.map((seg) => {
    let assignedLane = laneEndDates.findIndex((lastEndDate) => lastEndDate < seg.start);
    if (assignedLane === -1) {
      assignedLane = laneEndDates.length;
      laneEndDates.push(seg.end);
    } else {
      laneEndDates[assignedLane] = seg.end;
    }
    return { ...seg, lane: assignedLane };
  });

  const visible = segments.filter((s) => s.lane < maxLanes);
  const hidden = segments.filter((s) => s.lane >= maxLanes);

  const overflowByDate: Record<string, number> = {};
  hidden.forEach((seg) => {
    let cur = dayjs(seg.start);
    while (cur.isSameOrBefore(seg.end, 'day')) {
      const k = cur.format('YYYY-MM-DD');
      overflowByDate[k] = (overflowByDate[k] ?? 0) + 1;
      cur = cur.add(1, 'day');
    }
  });

  return { visible, overflowByDate };
}
