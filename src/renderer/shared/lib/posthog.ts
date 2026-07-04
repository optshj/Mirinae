import posthog from 'posthog-js';
import 'posthog-js/dist/recorder';

posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  autocapture: false,
  capture_pageview: false,
  disable_external_dependency_loading: true
});

export { posthog };
