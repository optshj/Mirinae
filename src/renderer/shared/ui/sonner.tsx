'use client';
import { Check, Trash2 } from 'lucide-react';
import { Toaster as Sonner } from 'sonner';

export const Toaster = () => {
  return (
    <Sonner
      position="top-center"
      expand={false}
      className="antialiased"
      style={{
        fontFamily: 'Pretendard Variable, Pretendard, "Segoe UI Symbol", sans-serif'
      }}
      icons={{
        success: <Check className="h-4 w-4" />,
        error: <Trash2 className="h-4 w-4" />,
        info: <Check className="h-4 w-4" />
      }}
      toastOptions={{
        classNames: {
          toast: 'group flex w-full gap-2 rounded-2xl items-center border border-gray-200/50 bg-white/90 backdrop-blur-md p-4 text-gray-800 shadow-[0_10px_40px_rgba(0,0,0,0.08)]',
          title: '!text-[15px] tracking-wider text-zinc-900 text-center',

          description: '!font-pretendard !text-[14px] !leading-relaxed text-zinc-500 mt-1',

          actionButton: 'rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-zinc-800 active:scale-95',
          cancelButton: 'rounded-xl bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-200',

          success: '[&_[data-icon]]:text-emerald-600',
          error: '[&_[data-icon]]:text-red-600',
          warning: '[&_[data-icon]]:text-amber-500',
          info: '[&_[data-icon]]:text-blue-600'
        }
      }}
    />
  );
};
