import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { posthog } from '@/shared/lib/posthog';

import { useEditEvent, getEventRange, EventSegment } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';

const DRAG_THRESHOLD = 5;

interface DragState {
  seg: EventSegment;
  grabDate: string;
  targetDate: string | null;
  // 일정 전체 길이 기준 고스트 크기와, 그 안에서 잡은 지점 (커서가 잡은 날 위에 그대로 붙어 있도록)
  ghost: { width: number; height: number; offsetX: number; offsetY: number };
}

export function useEventDrag() {
  const { editEvent } = useEditEvent();
  const [drag, setDrag] = useState<DragState | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef({ x: 0, y: 0 });

  // 드롭 시 일정이 차지하게 될 전체 날짜 범위 (긴 일정도 어디에 떨어질지 보이도록)
  const previewRange = useMemo(() => {
    if (!drag?.targetDate) return null;
    const delta = dayjs(drag.targetDate).diff(drag.grabDate, 'day');
    const [startDate, endDate] = getEventRange(drag.seg.event);
    return {
      start: dayjs(startDate).add(delta, 'day').format('YYYY-MM-DD'),
      end: dayjs(endDate).add(delta, 'day').format('YYYY-MM-DD')
    };
  }, [drag]);

  const commitMove = (event: CalendarEvent, grabDate: string, dropDate: string) => {
    if (event.category === 'holiday') return;
    const delta = dayjs(dropDate).diff(grabDate, 'day');
    const [startDate, endDate] = getEventRange(event);
    editEvent({
      eventId: event.id,
      summary: event.summary,
      colorId: event.colorId,
      allDay: event.category === 'allDay',
      start: event.category === 'time' ? dayjs(event.start.dateTime).format('HH:mm') : '08:00',
      end: event.category === 'time' ? dayjs(event.end.dateTime).format('HH:mm') : '12:00',
      startDate: dayjs(startDate).add(delta, 'day').format('YYYY-MM-DD'),
      endDate: dayjs(endDate).add(delta, 'day').format('YYYY-MM-DD'),
      // singleEvents=true로 받은 인스턴스에 대한 PUT → 해당 회차만 이동 (EditEventForm과 동일)
      recurrence: null
    });
    posthog.capture('drag_move_event', {
      day_delta: delta,
      category: event.category,
      duration_days: dayjs(endDate).diff(startDate, 'day') + 1
    });
  };

  const startDrag = (e: React.PointerEvent, seg: EventSegment) => {
    if (e.button !== 0 || seg.event.category === 'holiday') return;
    // preventDefault 금지: 더블클릭(수정 모달)이 계속 동작해야 함

    // 잡은 날짜 = 세그먼트 내에서 커서 아래에 있는 날
    const rect = e.currentTarget.getBoundingClientRect();
    const span = dayjs(seg.end).diff(seg.start, 'day') + 1;
    const dayIdx = Math.min(span - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * span)));
    const grabDate = dayjs(seg.start).add(dayIdx, 'day').format('YYYY-MM-DD');

    // 고스트는 잡은 세그먼트가 아니라 일정 전체 길이로 보여준다 (2주 이상 걸친 일정 포함).
    // 세그먼트 rect에서 셀 너비를 역산: pill 너비 = span×셀너비 − isStart/isEnd 마진(6px)
    const cellWidth = (rect.width + (seg.isStart ? 6 : 0) + (seg.isEnd ? 6 : 0)) / span;
    const [eventStart, eventEnd] = getEventRange(seg.event);
    const totalDays = dayjs(eventEnd).diff(eventStart, 'day') + 1;
    const ghostSeg: EventSegment = { event: seg.event, start: eventStart, end: eventEnd, isStart: true, isEnd: true, lane: 0 };
    const ghost = {
      width: totalDays * cellWidth,
      height: rect.height,
      // 커서가 전체 pill에서 잡은 날의 같은 지점 위에 오도록: 일정 시작~세그먼트 시작 간격 + 세그먼트 내 커서 위치
      offsetX: dayjs(seg.start).diff(eventStart, 'day') * cellWidth + (e.clientX - rect.left) + (seg.isStart ? 6 : 0),
      offsetY: e.clientY - rect.top
    };

    const startX = e.clientX;
    const startY = e.clientY;
    posRef.current = { x: startX, y: startY };
    let active = false;

    // 드래그 중 pill은 pointer-events-none이 되므로 elementFromPoint가 아래 날짜 셀을 찾음
    const hitTest = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-date]')?.dataset.date ?? null;

    const onMove = (me: PointerEvent) => {
      posRef.current = { x: me.clientX, y: me.clientY };
      if (!active) {
        if (Math.hypot(me.clientX - startX, me.clientY - startY) < DRAG_THRESHOLD) return;
        active = true;
        setDrag({ seg: ghostSeg, grabDate, targetDate: null, ghost });
      }
      if (ghostRef.current) {
        ghostRef.current.style.left = `${me.clientX - ghost.offsetX}px`;
        ghostRef.current.style.top = `${me.clientY - ghost.offsetY}px`;
      }
      const target = hitTest(me.clientX, me.clientY);
      setDrag((prev) => (prev && prev.targetDate !== target ? { ...prev, targetDate: target } : prev));
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onCancel);
      setDrag(null);
    };

    const onUp = (me: PointerEvent) => {
      if (active) {
        const dropDate = hitTest(me.clientX, me.clientY);
        if (dropDate && dropDate !== grabDate) commitMove(seg.event, grabDate, dropDate);
      }
      cleanup();
    };
    const onCancel = () => cleanup();
    const onKey = (ke: KeyboardEvent) => {
      if (ke.key === 'Escape') cleanup();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    // 벽지가 포커스를 잃으면(disable-click) pointerup이 안 올 수 있으므로 취소
    window.addEventListener('blur', onCancel);
  };

  return { drag, previewRange, ghostRef, posRef, startDrag };
}
