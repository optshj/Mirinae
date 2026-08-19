import { useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { posthog } from '@/shared/lib/posthog';

export function DarkModeButton() {
  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return storedTheme === 'dark' || (!storedTheme && prefersDark);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const selectTheme = (isDark: boolean) => {
    if (isDark === darkMode) return;
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    posthog.capture('theme_change', { theme: isDark ? 'dark' : 'light' });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span>화면 테마</span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={!darkMode}
          onClick={() => selectTheme(false)}
          className={cn(
            'flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 p-1.5 transition-colors',
            !darkMode ? 'border-main-color bg-main-color/20' : 'border-primary hover:bg-main-color/10'
          )}
        >
          <div className="flex h-8 w-full flex-col justify-center gap-1 rounded-md bg-[#f2f3f7] px-1.5">
            <div className="h-1 w-3/5 rounded-full bg-white" />
            <div className="h-1 w-4/5 rounded-full bg-white" />
          </div>
          <span className="text-xs">라이트</span>
        </button>
        <button
          type="button"
          aria-pressed={darkMode}
          onClick={() => selectTheme(true)}
          className={cn(
            'flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 p-1.5 transition-colors',
            darkMode ? 'border-main-color bg-main-color/20' : 'border-primary hover:bg-main-color/10'
          )}
        >
          <div className="flex h-8 w-full flex-col justify-center gap-1 rounded-md bg-[#2b2b30] px-1.5">
            <div className="h-1 w-3/5 rounded-full bg-[#46464c]" />
            <div className="h-1 w-4/5 rounded-full bg-[#46464c]" />
          </div>
          <span className="text-xs">다크</span>
        </button>
      </div>
    </div>
  );
}
