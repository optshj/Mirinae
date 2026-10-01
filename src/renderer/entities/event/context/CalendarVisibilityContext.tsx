import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'visible-calendars';

interface CalendarVisibilityContextValue {
  /** 표시할 캘린더 id 목록. null이면 아직 미리내에서 바꾼 적이 없어 Google의 selected를 따른다. */
  visibleIds: string[] | null;
  setVisibleIds: (ids: string[]) => void;
}

const CalendarVisibilityContext = createContext<CalendarVisibilityContextValue | null>(null);

export function CalendarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visibleIds, setVisibleIds] = useState<string[] | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (visibleIds) localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleIds));
  }, [visibleIds]);

  return <CalendarVisibilityContext.Provider value={{ visibleIds, setVisibleIds }}>{children}</CalendarVisibilityContext.Provider>;
}

export function useCalendarVisibility() {
  const ctx = useContext(CalendarVisibilityContext);
  if (!ctx) throw new Error('useCalendarVisibility must be used within CalendarVisibilityProvider');
  return ctx;
}
