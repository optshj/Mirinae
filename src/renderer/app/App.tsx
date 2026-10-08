import { useEffect } from 'react';
import Provider from './provider';
import { Calendar } from '@/pages';
import { Toaster } from '@/shared/ui/sonner';
import { useEventNotifications } from '@/features/event-notification';
import { useHoverTracking } from '@/shared/hooks/useHover';

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
  useEffect(() => window.api.rendererReady(), []);
  useHoverTracking();

  return (
    <Provider>
      <Calendar />
      <EventNotifications />
      <Toaster />
    </Provider>
  );
}
