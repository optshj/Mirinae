'use client';

import { Toaster as Sonner } from 'sonner';

export const Toaster = () => {
  return (
    <Sonner
      position="top-center"
      expand={false}
      className="antialiased"
      toastOptions={{
        classNames: {
          toast: 'group flex w-full items-start gap-3 rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-md p-4 text-gray-800 shadow-[0_10px_40px_rgba(0,0,0,0.08)]',
          title: '!font-pretendard !text-[13px] !font-bold !leading-tight tracking-tight text-zinc-900',

          description: '!font-pretendard !text-[13px] !leading-relaxed text-zinc-500 mt-1',

          actionButton: 'rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-zinc-800 active:scale-95',
          cancelButton: 'rounded-xl bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-200',

          success: '[&_[data-icon]]:text-emerald-600 [&_[data-icon]]:mt-0.5',
          error: '[&_[data-icon]]:text-red-600 [&_[data-icon]]:mt-0.5',
          warning: '[&_[data-icon]]:text-amber-600 [&_[data-icon]]:mt-0.5',
          info: '[&_[data-icon]]:text-blue-600 [&_[data-icon]]:mt-0.5'
        }
      }}
    />
  );
};
