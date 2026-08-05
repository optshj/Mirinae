import { createContext, useContext, useState } from 'react';
import { posthog } from '@/shared/lib/posthog';

interface MoveContextValue {
  isDrag: boolean;
  // 미니뷰에선 캘린더 폭이 CSS로 고정돼 있어 창 크기 조절이 무의미/오작동하므로 이동만 허용한다.
  canResize: boolean;
  container: HTMLElement | null;
  start: () => void;
  stop: () => void;
}

const MoveContext = createContext<MoveContextValue | null>(null);

export function MoveProvider({ children, container = null }: { children: React.ReactNode; container?: HTMLElement | null }) {
  const [isDrag, setIsDrag] = useState(false);
  const [canResize, setCanResize] = useState(true);

  const start = () => {
    const isMiniView = document.documentElement.classList.contains('mini-view');
    setIsDrag(true);
    setCanResize(!isMiniView);
    window.api.startDragging({ resizable: !isMiniView });
    if (!isMiniView) document.documentElement.classList.add('resizable');
    posthog.capture('move_active_button');
  };

  const stop = () => {
    setIsDrag(false);
    window.api.stopDragging();
    document.documentElement.classList.remove('resizable');
  };

  return <MoveContext.Provider value={{ isDrag, canResize, container, start, stop }}>{children}</MoveContext.Provider>;
}

export function useMove() {
  const ctx = useContext(MoveContext);
  if (!ctx) throw new Error('useMove must be used within a MoveProvider');
  return ctx;
}
