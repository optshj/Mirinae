import { createContext, useContext, useEffect, useState } from 'react';

interface HolidayContextValue {
  showHoliday: boolean;
  setShowHoliday: (value: boolean) => void;
}

const HolidayContext = createContext<HolidayContextValue | null>(null);

export function HolidayProvider({ children }: { children: React.ReactNode }) {
  const [showHoliday, setShowHolidayState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('holiday');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('holiday', showHoliday.toString());
  }, [showHoliday]);

  const setShowHoliday = (value: boolean) => {
    setShowHolidayState(value);
  };

  return <HolidayContext.Provider value={{ showHoliday, setShowHoliday }}>{children}</HolidayContext.Provider>;
}

export function useHoliday() {
  const ctx = useContext(HolidayContext);
  if (!ctx) throw new Error('useHoliday must be used within HolidayProvider');
  return ctx;
}
