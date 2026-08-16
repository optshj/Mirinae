import Provider from './provider';
import { Calendar } from '@/pages';
import { Toaster } from '@/shared/ui/sonner';
import { useEventNotifications } from '@/features/event-notification';

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ko';

dayjs.locale('ko');
dayjs.extend(isSameOrBefore);

// 일정 시작 알림 스케줄링 훅만 마운트하는 최소 컴포넌트.
// Provider(ReactQueryProvider 등) 하위에서 항상 마운트되어 화면 모드와 무관하게 동작한다.
function EventNotifications() {
  useEventNotifications();
  return null;
}

export default function App() {
  return (
    <Provider>
      <Calendar />
      <EventNotifications />
      <Toaster />
    </Provider>
  );
}
