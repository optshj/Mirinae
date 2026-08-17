import { useEffect, useRef } from 'react';
import { useCalendarItems } from '@/entities/event';
import { TimeEvent } from '@/shared/types/EventType';
import { posthog } from '@/shared/lib/posthog';

// setTimeout의 delay가 약 24.8일(2^31-1ms)을 넘으면 32비트 오버플로로 즉시 실행되는
// Node/Chromium 버그가 있다. getTimeRange()는 과거~미래 2년치 이벤트를 한 번에 가져오므로,
// 알림 시각이 이 범위 안에 드는 이벤트만 타이머로 예약하고 나머지는 다음 재계산(폴링 등) 때 다시 판단한다.
const SCHEDULE_WINDOW_MS = 60 * 60 * 1000; // 1시간

export function useEventNotifications() {
  const { items } = useCalendarItems();
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    let cancelled = false;

    async function schedule() {
      const enabled = await window.api.getNotificationsEnabled();
      if (cancelled || !enabled) return;

      const leadMinutes = await window.api.getNotificationLeadMinutes();
      if (cancelled) return;

      const timeEvents = items.filter((event): event is TimeEvent => event.category === 'time');
      const now = Date.now();

      timeEvents.forEach((event) => {
        if (notifiedIdsRef.current.has(event.id)) return;

        const notifyAt = new Date(event.start.dateTime).getTime() - leadMinutes * 60 * 1000;
        const delay = notifyAt - now;

        // 이미 지난 알림 시각이거나, 아직 예약 창(1시간) 밖이면 스킵한다.
        // 창 밖 이벤트는 items가 다시 바뀔 때(폴링 등) 재평가된다.
        if (delay < 0 || delay > SCHEDULE_WINDOW_MS) return;

        const timer = setTimeout(() => {
          notifiedIdsRef.current.add(event.id);
          window.api.showNotification({ title: event.summary || '일정', body: `${leadMinutes}분 후 시작` });
          posthog.capture('event_notification_shown', { event_id: event.id });
        }, delay);

        timersRef.current.push(timer);
      });
    }

    schedule();

    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [items]);
}
