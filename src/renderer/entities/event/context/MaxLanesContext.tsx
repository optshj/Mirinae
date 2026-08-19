import { createContext, useContext, useEffect, useState } from 'react';
import { posthog } from '@/shared/lib/posthog';

const STORAGE_KEY = 'max-lanes';
const DEFAULT_MAX_LANES = 3;

interface MaxLanesContextValue {
  maxLanes: number;
  setMaxLanes: (value: number) => void;
}

const MaxLanesContext = createContext<MaxLanesContextValue | null>(null);

export function MaxLanesProvider({ children }: { children: React.ReactNode }) {
  const [maxLanes, setMaxLanesState] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return saved || DEFAULT_MAX_LANES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(maxLanes));
  }, [maxLanes]);

  const setMaxLanes = (value: number) => {
    setMaxLanesState(value);
    posthog.capture('max_lanes_changed', { max_lanes: value });
  };

  return <MaxLanesContext.Provider value={{ maxLanes, setMaxLanes }}>{children}</MaxLanesContext.Provider>;
}

export function useMaxLanes() {
  const ctx = useContext(MaxLanesContext);
  if (!ctx) throw new Error('useMaxLanes must be used within MaxLanesProvider');
  return ctx;
}
