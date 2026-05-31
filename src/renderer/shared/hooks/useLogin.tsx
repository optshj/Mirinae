import { useCallback, useEffect, useState } from 'react';
import { setAuthToken } from '../lib/http';

export function useLogin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => {
    window.api.startGoogleOauth();
  };

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setAuthToken(null);
    window.api.logoutGoogleOAuth();
  }, []);

  const handleLogin = useCallback((receivedTokens) => {
    setAuthToken(receivedTokens.access_token);
    setIsAuthenticated(true);
  }, []);

  const handleError = useCallback((error) => {
    console.error('OAuth Error:', error);
  }, []);

  const refreshToken = useCallback(async () => {
    if (window.api.refreshToken) {
      try {
        const restoredTokens = await window.api.refreshToken();
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

  return { login, logout, isAuthenticated, refreshToken };
}
