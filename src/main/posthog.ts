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
  enableExceptionAutocapture: true
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
