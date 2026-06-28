import { createContext, useContext, useState } from 'react';
import { posthog } from '@/shared/lib/posthog';

interface MoveContextValue {
  isDrag: boolean;
  start: () => void;
  stop: () => void;
}

const MoveContext = createContext<MoveContextValue | null>(null);

export function MoveProvider({ children }: { children: React.ReactNode }) {
  const [isDrag, setIsDrag] = useState(false);

  const start = () => {
    setIsDrag(true);
    window.api.startDragging();
    document.documentElement.classList.add('resizable');
    posthog.capture('move_active_button');
  };

  const stop = () => {
    setIsDrag(false);
    window.api.stopDragging();
    document.documentElement.classList.remove('resizable');
  };

  return <MoveContext.Provider value={{ isDrag, start, stop }}>{children}</MoveContext.Provider>;
}

export function useMove() {
  const ctx = useContext(MoveContext);
  if (!ctx) throw new Error('useMove must be used within a MoveProvider');
  return ctx;
}
