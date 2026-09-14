import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { posthog } from '@/shared/lib/posthog';

interface LoginContextValue {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const LoginContext = createContext<LoginContextValue | null>(null);

export function LoginProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async () => {
    try {
      await window.api.loginGoogleOAuth();
    } catch {
      toast.error('로그인에 실패했어요. 잠시 후 다시 시도해 주세요', { id: 'login-error' });
      return;
    }
    setIsAuthenticated(true);
    posthog.capture('user_logged_in');
  };

  const logout = () => {
    setIsAuthenticated(false);
    window.api.logoutGoogleOAuth();
    posthog.capture('user_logged_out');
  };

  const restoreSession = useCallback(async () => {
    if (await window.api.restoreSession()) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    restoreSession();
    window.addEventListener('online', restoreSession);
    const removeAuthExpiredListener = window.api.onAuthExpired(() => setIsAuthenticated(false));

    return () => {
      removeAuthExpiredListener();
      window.removeEventListener('online', restoreSession);
    };
  }, [restoreSession]);

  return <LoginContext.Provider value={{ isAuthenticated, login, logout }}>{children}</LoginContext.Provider>;
}

export function useLogin() {
  const ctx = useContext(LoginContext);
  if (!ctx) throw new Error('useLogin must be used within a LoginProvider');
  return ctx;
}
