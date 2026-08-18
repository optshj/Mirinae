import { useEffect, useRef } from 'react';
import { useCalendarItems } from '@/entities/event';
import { TimeEvent } from '@/shared/types/EventType';
import { posthog } from '@/shared/lib/posthog';
import { useNotificationSettings } from '../model/notificationSettingsContext';

const SCHEDULE_WINDOW_MS = 60 * 60 * 1000; // 1시간 이내의 알림만 예약한다. (1시간 이상 남은 이벤트는 items가 다시 바뀔 때 재평가된다.)

export function useEventNotifications() {
  const { items } = useCalendarItems();
  const { enabled, leadMinutes } = useNotificationSettings();
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    if (!enabled) return;

    function schedule() {
      const timeEvents = items.filter((event): event is TimeEvent => event.category === 'time');
      const now = Date.now();

      timeEvents.forEach((event) => {
        if (notifiedIdsRef.current.has(event.id)) return;

        const notifyAt = new Date(event.start.dateTime).getTime() - leadMinutes * 60 * 1000;
        const delay = notifyAt - now;

        // 이미 지난 알림 시각이거나, 1시간 밖이면 스킵한다.
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
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [items, enabled, leadMinutes]);
}
