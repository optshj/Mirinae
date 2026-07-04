'use client';
import { Check, LoaderCircle, TriangleAlert, Undo2, X } from 'lucide-react';
import { toast, Toaster as Sonner } from 'sonner';
import { Tooltip } from '@/shared/ui/tooltip';

const UNDO_TOAST_DURATION = 5000;

export function showUndoToast(type: 'success' | 'error' | 'info', message: string, onUndo: () => void) {
  const toastId = `undo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  toast[type](message, {
    id: toastId,
    duration: UNDO_TOAST_DURATION,
    action: <ToastUndoButton toastId={toastId} onClick={onUndo} />
  });
}

interface ToastUndoButtonProps {
  toastId: string | number;
  onClick: () => void;
}
function ToastUndoButton({ toastId, onClick }: ToastUndoButtonProps) {
  return (
    <Tooltip content="되돌리기" side="bottom">
      <button
        aria-label="실행 취소"
        className="relative flex size-[30px] shrink-0 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-900 active:scale-95 dark:text-zinc-300 dark:hover:text-zinc-100"
        onClick={() => {
          onClick();
          toast.dismiss(toastId);
        }}
      >
        <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 30 30">
          <circle
            cx="15"
            cy="15"
            r="13"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="81.68"
            className="animate-toast-countdown stroke-emerald-500"
            style={{ '--toast-countdown-duration': `${UNDO_TOAST_DURATION}ms` } as React.CSSProperties}
          />
        </svg>
        <Undo2 size={14} strokeWidth={2.2} className="pointer-events-none relative" />
      </button>
    </Tooltip>
  );
}

export const Toaster = () => {
  return (
    <Sonner
      position="top-center"
      expand={false}
      offset={{ top: 84 }}
      mobileOffset={{ top: 84 }}
      className="antialiased"
      style={
        {
          fontFamily: 'Pretendard Variable, Pretendard, "Segoe UI Symbol", sans-serif',
          WebkitAppRegion: 'no-drag',
          pointerEvents: 'auto'
        } as React.CSSProperties
      }
      icons={{
        success: <Check className="h-4 w-4" />,
        error: <X className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        info: <Check className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4" />
      }}
      toastOptions={{
        style: { WebkitAppRegion: 'no-drag' } as React.CSSProperties,
        classNames: {
          toast:
            'group flex gap-2 rounded-full! w-fit! inset-x-0! mx-auto! px-4! py-3! items-center justify-center border border-primary! bg-primary! text-primary! shadow-[0_10px_40px_rgba(0,0,0,0.08)]',
          title: '!text-[15px]  tracking-wider text-center',
          description: '!text-[14px] !leading-relaxed text-secondary! mt-1 text-center',
          actionButton: '!h-auto !rounded-full !bg-zinc-100 !px-3 !py-1.5 !text-xs !font-semibold !text-zinc-700 transition-all hover:!bg-zinc-200 active:scale-95',
          cancelButton: 'rounded-xl bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-200',
          icon: '!size-4.5 !mx-0 !justify-center [&>svg]:!m-0',
          success: '[&_[data-icon]]:text-emerald-600',
          error: '[&_[data-icon]]:text-red-600',
          warning: '[&_[data-icon]]:text-amber-500',
          info: '[&_[data-icon]]:text-blue-600',
          loading: '[&_[data-icon]]:text-zinc-600 dark:[&_[data-icon]]:text-zinc-300 animate-spin'
        }
      }}
    />
  );
};
