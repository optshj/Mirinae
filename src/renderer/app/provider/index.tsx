import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactQueryProvider } from './QueryClient';
import { MaxLanesProvider } from '@/entities/event';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <MaxLanesProvider>
      <ReactQueryProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>{children}</GoogleOAuthProvider>
      </ReactQueryProvider>
    </MaxLanesProvider>
  );
}
