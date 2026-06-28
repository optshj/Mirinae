import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: Side;
  delay?: number; // 보이기까지 지연(ms), 기본 즉시
  className?: string;
  wrapperClassName?: string; // 트리거를 감싸는 래퍼 span에 적용 (기본 w-fit)
}

const sideClass: Record<Side, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2'
};

// 말풍선 꼬리: 툴팁 기준 반대편에 위치
const arrowClass: Record<Side, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
  left: 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2',
  right: 'right-full top-1/2 translate-x-1/2 -translate-y-1/2'
};

export function Tooltip({ content, children, side = 'top', delay = 0, className, wrapperClassName }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(false);

  const setOpenState = useCallback((value: boolean) => {
    openRef.current = value;
    setOpen(value);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    if (openRef.current) setOpenState(false);
  }, [clearTimer, setOpenState]);

  // 벽지(electron-as-wallpaper, forwarded mouse input) 환경에서는 mouseenter/leave·:hover가
  // 불안정하므로, LinearSlider처럼 전역 pointermove + getBoundingClientRect로 호버를 직접 판정한다.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (inside) {
        if (!openRef.current && !timerRef.current) {
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            setOpenState(true);
          }, delay);
        }
      } else {
        hide();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('blur', hide); // 다른 창으로 이동 시 안전하게 닫기
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', hide);
      clearTimer();
    };
  }, [delay, hide, setOpenState, clearTimer]);

  return (
    <span ref={ref} className={cn('relative inline-flex h-fit w-fit', wrapperClassName)} onPointerDown={hide}>
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'animate-in fade-in-0 zoom-in-95 pointer-events-none absolute z-50 w-max rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-white shadow-md duration-100 dark:bg-zinc-700',
            sideClass[side],
            className
          )}
        >
          {content}
          <span className={cn('absolute h-2 w-2 rotate-45 bg-zinc-800 dark:bg-zinc-700', arrowClass[side])} />
        </span>
      )}
    </span>
  );
}
