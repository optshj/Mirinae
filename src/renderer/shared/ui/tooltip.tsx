import { useEffect, useRef, useState } from 'react';

import { useHoveredIn } from '@/shared/hooks/useHover';
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
  const ref = useRef<HTMLSpanElement>(null);
  const hovered = useHoveredIn(ref) !== null;
  const [open, setOpen] = useState(false);

  // 커서가 떠나면 바로 닫고, 들어오면 delay 뒤에 연다. 클릭으로 닫은 뒤엔 나갔다 들어와야 다시 열린다.
  useEffect(() => {
    if (!hovered) return setOpen(false);
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [hovered, delay]);

  return (
    <span ref={ref} data-hoverable className={cn('relative inline-flex h-fit w-fit', wrapperClassName)} onPointerDown={() => setOpen(false)}>
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
