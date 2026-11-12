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
const LOOPBACK_HOST = '127.0.0.1';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.owned';

const hasAllScopes = (granted = '') => SCOPES.split(' ').every((scope) => granted.split(' ').includes(scope));

const generatePKCE = () => {
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
};

const RESULT_PAGES = {
  success: { title: '로그인 성공!', message: '창을 닫아주시면 앱에서 계속 진행됩니다.' },
  scope: { title: '권한을 모두 체크해 주세요', message: '캘린더 권한을 모두 체크해야 일정을 불러오고 추가할 수 있어요.' },
  failure: { title: '로그인에 실패했어요', message: '창을 닫고 다시 시도해 주세요.' }
};

const renderResultPage = (kind: keyof typeof RESULT_PAGES) => {
  const templatePath = app.isPackaged ? join(process.resourcesPath, 'resources', 'auth-result.html') : join(__dirname, '../../resources/auth-result.html');
  const { title, message } = RESULT_PAGES[kind];
  return readFileSync(templatePath, 'utf8').replace('{{state}}', kind).replaceAll('{{title}}', title).replaceAll('{{message}}', message);
};

const startAuthServer = (onListening: (redirectUri: string) => void): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
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
      const error = url.searchParams.get('error');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      if (code && hasAllScopes(url.searchParams.get('scope') ?? '')) {
        res.end(renderResultPage('success'));
        cleanup();
        resolve(code);
      } else if (code || error === 'access_denied') {
        res.end(renderResultPage('scope'));
        cleanup();
        reject(new Error(`MISSING_SCOPE (${code ? 'partial' : error})`));
      } else {
        res.end(renderResultPage('failure'));
        cleanup();
        reject(new Error(`No authorization code received (${error ?? url.pathname})`));
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
          reject(new Error('인증 시간 초과'));
        },
        5 * 60 * 1000 // 5분
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

// Access 토큰은 메모리에서 관리
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

const refreshSession = async () => {
  try {
    const refreshToken = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (!refreshToken) return false;

    const tokenData = await refreshAccessToken(refreshToken);
    if (!hasAllScopes(tokenData.scope)) {
      // 권한 일부만 허용된 채 저장된 토큰은 버린다 (다시 로그인해서 모두 허용해야 함)
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      return false;
    }
    if (tokenData.refresh_token) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, tokenData.refresh_token);
    }
    accessToken = tokenData.access_token;
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// 싱글플라이트
export const restoreSession = async () => {
  if (refreshing) return refreshing;
  refreshing = refreshSession();
  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
};

export const googleRequest = async (event: Electron.IpcMainInvokeEvent, url: string, { method, body }: { method?: string; body?: string } = {}) => {
  const { href } = new URL(url);
  if (!href.startsWith('https://www.googleapis.com/calendar/v3/')) throw new Error(`허용되지 않은 요청 주소입니다: ${url}`);

  const send = () => fetch(href, { method, body, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` } });
  let response = await send();

  if (response.status === 401) {
    await restoreSession();
    response = await send();
  }

  if (response.status === 401) event.sender.send('auth-expired');

  return { status: response.status, body: await response.json().catch(() => null) };
};

export const logoutGoogleOAuth = async () => {
  accessToken = null;
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  return true;
};

let pendingLogin: Promise<void> | null = null;
let pendingAuthUrl: string | null = null;

export const loginGoogleOAuth = () => {
  if (pendingLogin) {
    if (pendingAuthUrl) shell.openExternal(pendingAuthUrl);
    return pendingLogin;
  }
  pendingLogin = startLogin().finally(() => {
    pendingLogin = null;
    pendingAuthUrl = null;
  });
  return pendingLogin;
};

const startLogin = async () => {
  const { codeVerifier, codeChallenge } = generatePKCE();
  let redirectUri = '';

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
    pendingAuthUrl = authUrl.toString();
    shell.openExternal(pendingAuthUrl);
  });

  const tokens = await fetchAccessTokens(authCode, codeVerifier, redirectUri);
  if (!hasAllScopes(tokens.scope)) throw new Error('MISSING_SCOPE (token)'); // 콜백 scope 검사를 통과했는데 토큰이 다른 경우 대비
  if (tokens.refresh_token) {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, tokens.refresh_token);
  }
  accessToken = tokens.access_token;
};
