import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactQueryProvider } from './QueryClient';
import { MaxLanesProvider, HolidayProvider } from '@/entities/event';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <MaxLanesProvider>
      <HolidayProvider>
        <ReactQueryProvider>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>{children}</GoogleOAuthProvider>
        </ReactQueryProvider>
      </HolidayProvider>
    </MaxLanesProvider>
  );
}
