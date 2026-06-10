import { shell, app } from 'electron';
import { readFileSync } from 'fs';
import http from 'http';
import crypto from 'crypto';
import keytar from 'keytar';
import { join } from 'path';
import { posthog, getDistinctId } from './posthog';

const SERVICE_NAME = 'Mirinae';
const ACCOUNT_NAME = 'google-refresh-token';
const CLIENT_ID = process.env.VITE_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_CLIENT_SECRET;
const LOOPBACK_HOST = '127.0.0.1';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.owned';

const generatePKCE = () => {
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
};

const startAuthServer = (onListening: (redirectUri: string) => void): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const successPath = app.isPackaged ? join(process.resourcesPath, 'resources', 'success.html') : join(__dirname, '../../resources/success.html');
    let server: http.Server | null = null;
    let timeout: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      server?.close();
      server = null;
    };

    server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const code = url.searchParams.get('code');

      if (code) {
        res.end(readFileSync(successPath));
        cleanup();
        resolve(code);
      } else {
        res.end('<h1>Authentication failed. Please try again.</h1>');
        cleanup();
        reject(new Error('No authorization code received'));
      }
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      cleanup();
      reject(new Error(`인증 서버를 시작하지 못했습니다 (${err.code ?? err.message})`));
    });

    server.listen(0, LOOPBACK_HOST, () => {
      const address = server?.address();
      if (!address || typeof address === 'string') {
        cleanup();
        reject(new Error('인증 서버 포트를 확인하지 못했습니다'));
        return;
      }

      timeout = setTimeout(
        () => {
          cleanup();
          reject(new Error('Authentication timeout'));
        },
        5 * 60 * 1000
      );

      onListening(`http://${LOOPBACK_HOST}:${address.port}/callback`);
    });
  });
};

const fetchAccessTokens = async (code: string, codeVerifier: string, redirectUri: string) => {
  const params = new URLSearchParams({
    code,
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) throw new Error(`Failed to fetch tokens (status: ${response.status})`);

  return await response.json();
};

// Access 토큰 재발급
const refreshAccessToken = async (refresh_token: string) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    refresh_token,
    grant_type: 'refresh_token'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh access token (status: ${response.status})`);
  }
  return await response.json();
};

// 자동 로그인 시도
export const tryAutoLogin = async () => {
  const refreshToken = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  if (!refreshToken) return null;

  try {
    const tokenData = await refreshAccessToken(refreshToken);
    if (tokenData.refresh_token) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, tokenData.refresh_token);
    }
    return tokenData;
  } catch (error) {
    posthog.captureException(error, getDistinctId(), { context: 'auto_login' });
    posthog.capture({
      distinctId: getDistinctId(),
      event: 'auto_login_failed',
      properties: { error: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }
};

// 로그아웃
export const logoutGoogleOAuth = async () => {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  posthog.capture({ distinctId: getDistinctId(), event: 'user_logged_out' });
  return true;
};

// Google OAuth 시작
export const startGoogleOAuth = async (event: Electron.IpcMainEvent) => {
  const { codeVerifier, codeChallenge } = generatePKCE();
  let redirectUri = '';

  try {
    const authCode = await startAuthServer((listeningRedirectUri) => {
      redirectUri = listeningRedirectUri;

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', CLIENT_ID!);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', SCOPES);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('access_type', 'offline');

      shell.openExternal(authUrl.toString());
    });

    const tokens = await fetchAccessTokens(authCode, codeVerifier, redirectUri);
    if (tokens.refresh_token) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, tokens.refresh_token);
    }

    posthog.capture({
      distinctId: getDistinctId(),
      event: 'user_logged_in',
      properties: { app_version: app.getVersion() }
    });

    event.sender.send('google-oauth-token', tokens);
  } catch (error) {
    console.error('OAuth Error:', error);
    posthog.captureException(error, getDistinctId(), { context: 'google_oauth' });
    event.sender.send('google-oauth-error', error instanceof Error ? error.message : String(error));
  }
};
