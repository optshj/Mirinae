import { GoogleOAuthProvider } from '@react-oauth/google';
import { CalendarItemsProvider } from '@/features/event';
import { ReactQueryProvider } from './QueryClient';

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

export default function Provider({ children }: { children: React.ReactNode }) {
    return (
        <ReactQueryProvider>
            <CalendarItemsProvider>
                <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>
            </CalendarItemsProvider>
        </ReactQueryProvider>
    );
}
