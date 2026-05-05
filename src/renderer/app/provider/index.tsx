import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactQueryProvider } from './QueryClient';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>{children}</GoogleOAuthProvider>
    </ReactQueryProvider>
  );
}
