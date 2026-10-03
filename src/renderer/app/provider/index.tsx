import { ReactQueryProvider } from './QueryClient';
import { NotificationSettingsProvider } from '@/features/event-notification';
import { LoginProvider } from '@/shared/hooks/useLogin';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <NotificationSettingsProvider>
      <ReactQueryProvider>
        <LoginProvider>{children}</LoginProvider>
      </ReactQueryProvider>
    </NotificationSettingsProvider>
  );
}
