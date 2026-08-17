import { useColorFilter } from '@/entities/event';
import { COLORPALLETTE } from '@/shared/const/color';
import { Check } from 'lucide-react';

export function ColorFilterButton() {
  const { filteredColors, toggleColor, clearFilter } = useColorFilter();
  const isActive = filteredColors.size > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span>색상 필터</span>
        {isActive && <span className="text-muted-foreground text-xs">{filteredColors.size}개</span>}
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {COLORPALLETTE.map((key) => (
          <div
            key={key}
            className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-all hover:scale-150 dark:saturate-70 event-color-${key} bg-(--event-color)`}
            onClick={() => toggleColor(key)}
          >
            {filteredColors.has(key) && <Check className="text-white" strokeWidth={3} size={12} />}
          </div>
        ))}
      </div>
      {isActive && (
        <button onClick={clearFilter} className="text-muted-foreground hover:text-foreground w-full rounded text-xs transition-colors">
          필터 초기화
        </button>
      )}
    </div>
  );
}
