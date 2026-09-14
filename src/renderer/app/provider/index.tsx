import { ReactQueryProvider } from './QueryClient';
import { MaxLanesProvider, HolidayProvider, ColorFilterProvider } from '@/entities/event';
import { NotificationSettingsProvider } from '@/features/event-notification';
import { LoginProvider } from '@/shared/hooks/useLogin';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <MaxLanesProvider>
      <ColorFilterProvider>
        <HolidayProvider>
          <NotificationSettingsProvider>
            <ReactQueryProvider>
              <LoginProvider>{children}</LoginProvider>
            </ReactQueryProvider>
          </NotificationSettingsProvider>
        </HolidayProvider>
      </ColorFilterProvider>
    </MaxLanesProvider>
  );
}
