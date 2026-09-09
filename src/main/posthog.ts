import { PostHog } from 'posthog-node';
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
  disableGeoip: false
});

export const getDistinctId = (): string => getOrCreateDeviceId();

export const shutdownPostHog = async (): Promise<void> => {
  await posthog.shutdown();
};
