'use client';
import { Check, LoaderCircle, TriangleAlert, X } from 'lucide-react';
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
        error: <X className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        info: <Check className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4" />
      }}
      toastOptions={{
        classNames: {
          toast:
            'group flex gap-2 rounded-full! w-fit! inset-x-0! mx-auto! px-4! py-3! items-center justify-center border border-gray-200/50 bg-white/90 text-gray-800 shadow-[0_10px_40px_rgba(0,0,0,0.08)]',
          title: '!text-[15px]  tracking-wider text-zinc-900 text-center',
          description: '!text-[14px] !leading-relaxed text-zinc-500 mt-1 text-center',
          actionButton: 'rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-zinc-800 active:scale-95',
          cancelButton: 'rounded-xl bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-200',
          icon: '!size-4.5 !mx-0 !justify-center [&>svg]:!m-0',
          success: '[&_[data-icon]]:text-emerald-600',
          error: '[&_[data-icon]]:text-red-600',
          warning: '[&_[data-icon]]:text-amber-500',
          info: '[&_[data-icon]]:text-blue-600',
          loading: '[&_[data-icon]]:text-zinc-600 animate-spin'
        }
      }}
    />
  );
};
