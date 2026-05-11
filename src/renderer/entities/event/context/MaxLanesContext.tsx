import { createContext, useContext, useEffect, useState } from 'react';

interface MaxLanesContextValue {
  maxLanes: number;
  setMaxLanes: (value: number) => void;
}

const MaxLanesContext = createContext<MaxLanesContextValue | null>(null);

export function MaxLanesProvider({ children }: { children: React.ReactNode }) {
  const [maxLanes, setMaxLanesState] = useState(3);

  useEffect(() => {
    window.api.getMaxLanes().then(setMaxLanesState);
  }, []);

  const setMaxLanes = (value: number) => {
    setMaxLanesState(value);
    window.api.setMaxLanes(value);
  };

  return <MaxLanesContext.Provider value={{ maxLanes, setMaxLanes }}>{children}</MaxLanesContext.Provider>;
}

export function useMaxLanes() {
  const ctx = useContext(MaxLanesContext);
  if (!ctx) throw new Error('useMaxLanes must be used within MaxLanesProvider');
  return ctx;
}
