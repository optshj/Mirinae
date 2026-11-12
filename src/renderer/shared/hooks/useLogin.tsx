import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { posthog } from '@/shared/lib/posthog';

interface LoginContextValue {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

const LoginContext = createContext<LoginContextValue | null>(null);

export function LoginProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  const login = async () => {
    try {
      await window.api.loginGoogleOAuth();
    } catch (error) {
      // IPC를 거치면 메시지 앞에 "Error invoking remote method ..."가 붙는다
      const reason = String(error).replace(/^.*Error invoking remote method '[^']+': (Error: )?/, '');
      posthog.capture('user_login_failed', { reason });
      // 권한 누락은 브라우저 결과 페이지(auth-result.html)에서도 안내한다
      toast.error(reason.includes('MISSING_SCOPE') ? '캘린더 권한을 모두 체크해야 일정을 불러오고 추가할 수 있어요' : '로그인에 실패했어요. 잠시 후 다시 시도해 주세요', { id: 'login-error' });
      return;
    }
    setIsAuthenticated(true);
    posthog.capture('user_logged_in');
  };

  const logout = () => {
    setIsAuthenticated(false);
    queryClient.removeQueries();
    window.api.logoutGoogleOAuth();
    posthog.capture('user_logged_out');
  };

  const restoreSession = useCallback(async () => {
    if (await window.api.restoreSession()) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    restoreSession();
    window.addEventListener('online', restoreSession);
    const removeAuthExpiredListener = window.api.onAuthExpired(() => {
      setIsAuthenticated(false);
      queryClient.removeQueries();
    });

    return () => {
      removeAuthExpiredListener();
      window.removeEventListener('online', restoreSession);
    };
  }, [restoreSession, queryClient]);

  return <LoginContext.Provider value={{ isAuthenticated, login, logout, restoreSession }}>{children}</LoginContext.Provider>;
}

export function useLogin() {
  const ctx = useContext(LoginContext);
  if (!ctx) throw new Error('useLogin must be used within a LoginProvider');
  return ctx;
}
