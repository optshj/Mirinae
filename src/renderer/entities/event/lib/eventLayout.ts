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

export type TimeSegment = {
  event: CalendarEvent;
  date: string; // YYYY-MM-DD
  startMin: number; // 자정 기준 분, [0, 1440]으로 clamp
  endMin: number;
  isStart: boolean; // 이벤트가 실제로 이 날짜에 시작하는지 (전날에서 넘어온 게 아닌지)
  isEnd: boolean;
  col: number; // 겹침 클러스터 내 컬럼 인덱스
  colCount: number; // 겹침 클러스터의 전체 컬럼 수
};

const MIN_BLOCK_MINUTES = 30;

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

// 하루(00:00~24:00) 안에서 시간 단위 이벤트들의 겹침을 컬럼으로 배치 (주별 뷰의 시간 그리드용)
export function buildDayTimeSegments(events: CalendarEvent[], date: string): TimeSegment[] {
  const dayStart = dayjs(date).startOf('day');
  const dayEnd = dayStart.add(1, 'day');

  const clipped = events.flatMap((event) => {
    if (event.category !== 'time') return [];

    const eventStart = dayjs(event.start.dateTime);
    const eventEnd = dayjs(event.end.dateTime);
    if (!eventStart.isBefore(dayEnd) || !eventEnd.isAfter(dayStart)) return [];

    const startMin = Math.max(0, eventStart.diff(dayStart, 'minute'));
    let endMin = Math.min(1440, eventEnd.diff(dayStart, 'minute'));
    endMin = Math.max(endMin, startMin + MIN_BLOCK_MINUTES, MIN_BLOCK_MINUTES);
    endMin = Math.min(endMin, 1440);

    return [
      {
        event,
        date,
        startMin,
        endMin,
        isStart: eventStart.isSame(dayStart, 'day'),
        isEnd: eventEnd.isSame(dayStart, 'day') || eventEnd.isSame(dayEnd)
      }
    ];
  });

  // 정렬 규칙: 시작 시각 빠른 순 -> 길이 긴 순 (buildWeekSegments와 동일한 관례)
  clipped.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - b.startMin - (a.endMin - a.startMin);
  });

  // 컬럼 배치: sweep으로 겹침 클러스터(연결된 겹침 그룹)를 구성하고, 클러스터별로 최소 빈 컬럼을 배정
  type Entry = { seg: (typeof clipped)[number]; col: number };
  const segments: TimeSegment[] = [];
  let active: Entry[] = [];
  let cluster: Entry[] = [];
  let clusterMaxCol = 0;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const colCount = clusterMaxCol + 1;
    cluster.forEach(({ seg, col }) => segments.push({ ...seg, col, colCount }));
  };

  clipped.forEach((seg) => {
    active = active.filter((a) => a.seg.endMin > seg.startMin);
    if (active.length === 0) {
      flushCluster();
      cluster = [];
      clusterMaxCol = 0;
    }

    const usedCols = new Set(active.map((a) => a.col));
    let col = 0;
    while (usedCols.has(col)) col += 1;

    const entry: Entry = { seg, col };
    active.push(entry);
    cluster.push(entry);
    clusterMaxCol = Math.max(clusterMaxCol, col);
  });
  flushCluster();

  return segments;
}
