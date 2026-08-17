import { ReactQueryProvider } from './QueryClient';
import { MaxLanesProvider, HolidayProvider, ColorFilterProvider } from '@/entities/event';
import { NotificationSettingsProvider } from '@/features/event-notification';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <MaxLanesProvider>
      <ColorFilterProvider>
        <HolidayProvider>
          <NotificationSettingsProvider>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </NotificationSettingsProvider>
        </HolidayProvider>
      </ColorFilterProvider>
    </MaxLanesProvider>
  );
}
