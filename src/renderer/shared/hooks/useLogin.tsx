import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { setAuthToken, getAuthToken } from '../lib/http';
import { posthog } from '@/shared/lib/posthog';

interface LoginContextValue {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const LoginContext = createContext<LoginContextValue | null>(null);

// IPC 리스너 등록과 시작 시 토큰 갱신은 앱에 한 번만 일어나야 하므로 Provider 하나가 소유한다.
export function LoginProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));

  const login = () => {
    window.api.startGoogleOauth();
  };

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setAuthToken(null);
    window.api.logoutGoogleOAuth();
    posthog.capture('user_logged_out');
  }, []);

  const handleLogin = useCallback(async (receivedTokens) => {
    setAuthToken(receivedTokens.access_token);
    setIsAuthenticated(true);
    posthog.capture('user_logged_in', { app_version: await window.api.getAppVersion() });
  }, []);

  const handleError = useCallback(() => {
    toast.error('로그인에 실패했어요. 잠시 후 다시 시도해 주세요', { id: 'login-error' });
  }, []);

  const refreshToken = useCallback(async () => {
    if (window.api.tokenRefresh) {
      try {
        const restoredTokens = await window.api.tokenRefresh();
        if (restoredTokens?.access_token) {
          setAuthToken(restoredTokens.access_token);
          setIsAuthenticated(true);
          return restoredTokens;
        }
      } catch (err) {
        console.error('Auto login failed:', err);
      }
    }
    return null;
  }, []);

  useEffect(() => {
    refreshToken();
    window.addEventListener('online', refreshToken);
    window.addEventListener('auth-expired', logout);

    const removeSuccessListener = window.api.onGoogleOauthSuccess(handleLogin);
    const removeErrorListener = window.api.onGoogleOauthError(handleError);

    return () => {
      removeSuccessListener();
      removeErrorListener();
      window.removeEventListener('online', refreshToken);
      window.removeEventListener('auth-expired', logout);
    };
  }, [handleLogin, handleError, refreshToken, logout]);

  return <LoginContext.Provider value={{ isAuthenticated, login, logout }}>{children}</LoginContext.Provider>;
}

export function useLogin() {
  const ctx = useContext(LoginContext);
  if (!ctx) throw new Error('useLogin must be used within a LoginProvider');
  return ctx;
}
