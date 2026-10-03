import { posthog } from '@/shared/lib/posthog';

export function QuitAppButton() {
  return (
    <div
      onClick={() => {
        posthog.capture('quit_app', undefined, { send_instantly: true });
        window.api.quitApp();
      }}
      className="text-red-500 dark:text-red-400"
    >
      앱 종료
    </div>
  );
}
