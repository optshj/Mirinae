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

type RangedEvent = { event: CalendarEvent; start: string; end: string; duration: number };

function toRangedEvents(events: CalendarEvent[]): RangedEvent[] {
  return events.map((event) => {
    const [start, end] = getEventRange(event);
    return { event, start, end, duration: dayjs(end).diff(start, 'day') };
  });
}

// 정렬 규칙: 시작일 빠른 순 -> 기간 긴 순 -> 휴일 우선.
// duration을 미리 계산해둬서 정렬 비교(O(N log N)번)마다 dayjs 파싱을 다시 하지 않게 한다.
function compareRangedEvents(a: RangedEvent, b: RangedEvent) {
  if (a.start !== b.start) return a.start.localeCompare(b.start);
  if (a.duration !== b.duration) return b.duration - a.duration;
  if (a.event.category === 'holiday' && b.event.category !== 'holiday') return -1;
  if (b.event.category === 'holiday' && a.event.category !== 'holiday') return 1;
  return 0;
}

type ClippedEvent = { event: CalendarEvent; start: string; end: string; isStart: boolean; isEnd: boolean };

// 겹치지 않게 '차선(lane)' 배정 (Greedy Algorithm)
function layoutWeek(clipped: ClippedEvent[], maxLanes: number) {
  const laneEndDates: string[] = []; // 각 차선별로 마지막 일정이 끝나는 날짜 저장

  const segments: EventSegment[] = clipped.map((seg) => {
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

// 이전에는 주(week)마다 전체 이벤트 배열을 다시 훑었다 (O(주 수 x 이벤트 수)) - 예를 들어 공휴일 표시를
// 껐다 켰다 하면 그 영향이 없는 주까지 매번 전체 재계산됐다. 여기선 한 번만 정렬해두고 시작일 순으로
// 이미 지나간 이벤트는 건너뛰는 슬라이딩 윈도우(lo)로 훑어서, 정렬 O(N log N) + 스캔 O(N + 주 수) 정도로 줄인다.
export function buildMonthSegments(events: CalendarEvent[], weeks: Array<{ start: string; end: string }>, maxLanes: number) {
  const ranged = toRangedEvents(events).sort(compareRangedEvents);

  let lo = 0;
  return weeks.map(({ start: weekStart, end: weekEnd }) => {
    while (lo < ranged.length && ranged[lo].end < weekStart) lo++;

    const clipped: ClippedEvent[] = [];
    for (let i = lo; i < ranged.length; i++) {
      const r = ranged[i];
      if (r.start > weekEnd) break; // start 오름차순 정렬이라 이 뒤로는 이번 주에 걸칠 수 없음
      if (r.end < weekStart) continue; // lo보다 뒤에 있지만 이미 끝난 이벤트 (여러 주 겹치는 긴 이벤트 사이에 낀 경우)
      const start = r.start < weekStart ? weekStart : r.start;
      const end = r.end > weekEnd ? weekEnd : r.end;
      clipped.push({ event: r.event, start, end, isStart: start === r.start, isEnd: end === r.end });
    }

    return layoutWeek(clipped, maxLanes);
  });
}
