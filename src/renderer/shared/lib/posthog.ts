import posthog from 'posthog-js';
// 세션 리플레이용 recorder 번들. 구형 'dist/recorder'는 initSessionRecording을 등록하지 않아
// disable_external_dependency_loading과 함께 쓰면 녹화가 lazy_loading 상태에 영원히 멈춘다
import 'posthog-js/dist/posthog-recorder';
import 'posthog-js/dist/exception-autocapture';

posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  autocapture: false,
  capture_pageview: false,
  capture_exceptions: true,
  disable_external_dependency_loading: true
});

export { posthog };
