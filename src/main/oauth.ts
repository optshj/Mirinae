import { shell, app } from 'electron';
import { readFileSync } from 'fs';
import http from 'http';
import crypto from 'crypto';
import keytar from 'keytar';
import { join } from 'path';

const SERVICE_NAME = 'Mirinae';
const ACCOUNT_NAME = 'google-refresh-token';
const CLIENT_ID = process.env.VITE_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5858/callback';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.owned';

const generatePKCE = () => {
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
};

const startAuthServer = (resolve: (code: string) => void, reject: (error: Error) => void) => {
  const successPath = app.isPackaged ? join(process.resourcesPath, 'resources', 'success.html') : join(__dirname, '../../resources/success.html');
  let server: http.Server | null = null;

  server = http
    .createServer((req, res) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const code = url.searchParams.get('code');

      if (code) {
        res.end(readFileSync(successPath));
        resolve(code);
      } else {
        res.end('<h1>Authentication failed. Please try again.</h1>');
        reject(new Error('No authorization code received'));
      }

      server?.close();
      server = null;
    })
    .listen(5858);
};

// Access / Refresh 토큰 요청
const fetchAccessTokens = async (code: string, codeVerifier: string) => {
  const params = new URLSearchParams({
    code,
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tokens (status: ${response.status})`);
  }
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
  if (!refreshToken) {
    return null;
  }

  const tokenData = await refreshAccessToken(refreshToken);
  if (tokenData.refresh_token) {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, tokenData.refresh_token);
  }
  return tokenData;
};

// 로그아웃
export const logoutGoogleOAuth = async () => {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  return true;
};

// Google OAuth 시작
export const startGoogleOAuth = async (event: Electron.IpcMainEvent) => {
  const { codeVerifier, codeChallenge } = generatePKCE();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', CLIENT_ID!);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  try {
    shell.openExternal(authUrl.toString());

    const authCode = await new Promise<string>((resolve, reject) => {
      startAuthServer(resolve, reject);
    });

    const tokens = await fetchAccessTokens(authCode, codeVerifier);
    if (tokens.refresh_token) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, tokens.refresh_token);
    }

    event.sender.send('google-oauth-token', tokens);
  } catch (error) {
    console.error('OAuth Error:', error);
    event.sender.send('google-oauth-error');
  }
};
