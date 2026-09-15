import { useEffect } from 'react';
import Provider from './provider';
import { Calendar } from '@/pages';
import { Toaster } from '@/shared/ui/sonner';
import { useEventNotifications } from '@/features/event-notification';

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ko';

dayjs.locale('ko');
dayjs.extend(isSameOrBefore);

function EventNotifications() {
  useEventNotifications();
  return null;
}

export default function App() {
  // 렌더러 OTA 부팅 성공 신호. 루트가 커밋되면 정상 렌더다 — 루트에 ErrorBoundary/Suspense를 넣으면 호출 위치를 옮길 것
  useEffect(() => window.api.rendererReady(), []);

  return (
    <Provider>
      <Calendar />
      <EventNotifications />
      <Toaster />
    </Provider>
  );
}
