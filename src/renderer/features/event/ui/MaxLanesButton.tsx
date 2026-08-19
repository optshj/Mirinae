import { cn } from '@/shared/lib/utils';
import { useMaxLanes } from '@/entities/event';

const MAX_LANES_OPTIONS = [1, 2, 3, 4, 5] as const;

export function MaxLanesButton() {
  const { maxLanes, setMaxLanes } = useMaxLanes();

  return (
    <div className="flex flex-col gap-1.5">
      <span>일정표시</span>
      <div role="tablist" aria-label="일정표시" className="grid grid-cols-5 gap-0.5 rounded-md bg-black/5 p-0.5 dark:bg-white/10">
        {MAX_LANES_OPTIONS.map((lanes) => (
          <button
            key={lanes}
            type="button"
            role="tab"
            aria-selected={lanes === maxLanes}
            tabIndex={-1}
            onClick={() => setMaxLanes(lanes)}
            className={cn(
              'rounded px-1 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors',
              lanes === maxLanes ? 'bg-main-color text-white shadow-xs' : 'text-primary/55 hover:text-primary'
            )}
          >
            {lanes}줄
          </button>
        ))}
      </div>
    </div>
  );
}
