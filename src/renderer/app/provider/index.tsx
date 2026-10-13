import { ReactQueryProvider } from './QueryClient';
import { HolidayProvider, ColorFilterProvider, CalendarVisibilityProvider } from '@/entities/event';
import { NotificationSettingsProvider } from '@/features/event-notification';
import { LoginProvider } from '@/shared/hooks/useLogin';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ColorFilterProvider>
      <HolidayProvider>
        <CalendarVisibilityProvider>
          <NotificationSettingsProvider>
            <ReactQueryProvider>
              <LoginProvider>{children}</LoginProvider>
            </ReactQueryProvider>
          </NotificationSettingsProvider>
        </CalendarVisibilityProvider>
      </HolidayProvider>
    </ColorFilterProvider>
  );
}
