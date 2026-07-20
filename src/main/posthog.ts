import { PostHog } from 'posthog-node';
import { app } from 'electron';
import { store } from './store';
import crypto from 'crypto';

function getOrCreateDeviceId(): string {
  let deviceId = store.get('posthog-device-id') as string | undefined;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    store.set('posthog-device-id', deviceId);
  }
  return deviceId;
}

export const posthog = new PostHog(process.env.VITE_POSTHOG_API_KEY!, {
  host: process.env.VITE_POSTHOG_HOST,
  enableExceptionAutocapture: true,
  // posthog-node는 서버 SDK라 GeoIP가 기본 비활성화지만, 데스크톱 앱은 main 프로세스도
  // 사용자 PC에서 실행되므로 IP 기반 지역 정보($geoip_country_name 등)를 살린다
  disableGeoip: false
});

export const getDistinctId = (): string => getOrCreateDeviceId();

export const shutdownPostHog = async (): Promise<void> => {
  await posthog.shutdown();
};

export const setUserDistinctId = (userId: string): void => {
  store.set('posthog-user-id', userId);
};

export const getUserDistinctId = (): string => {
  return (store.get('posthog-user-id') as string | undefined) ?? getOrCreateDeviceId();
};

export const appVersion = (): string => app.getVersion();
