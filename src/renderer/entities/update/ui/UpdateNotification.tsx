import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';

interface UpdateInfo {
  currentVersion: string;
  newVersion: string;
}
export function UpdateNotification() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const cleanup = window.api.onUpdateDownloaded((data) => setInfo(data));
    return cleanup;
  }, []);

  if (!info) return null;

  const handleInstall = () => {
    window.api.installUpdate();
    setInfo(null);
  };

  const handleDismiss = () => {
    window.api.dismissUpdate();
    setInfo(null);
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in bg-primary fixed bottom-4 left-4 z-50 w-72 rounded-xl border border-neutral-200 p-4 shadow-lg duration-300 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">업데이트가 준비됐어요</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <span>v{info.currentVersion}</span>
        <span>→</span>
        <span className="font-medium text-neutral-900 dark:text-neutral-50">v{info.newVersion}</span>
      </p>
      <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">설치하면 앱이 잠깐 재시작돼요.</p>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          나중에
        </Button>
        <Button size="sm" onClick={handleInstall}>
          지금 설치
        </Button>
      </div>
    </div>
  );
}
