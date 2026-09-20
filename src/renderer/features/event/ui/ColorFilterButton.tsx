import { useColorFilter } from '@/entities/event';

import { ColorChips } from './components/ColorChips';

export function ColorFilterButton() {
  const { filteredColors, toggleColor, clearFilter } = useColorFilter();
  const isActive = filteredColors.size > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span>색상 필터</span>
        {isActive && <span className="text-muted-foreground text-xs">{filteredColors.size}개</span>}
      </div>
      <ColorChips isSelected={(key) => filteredColors.has(key)} onSelect={toggleColor} />
      {isActive && (
        <button onClick={clearFilter} className="text-muted-foreground hover:text-foreground w-full rounded text-xs transition-colors">
          필터 초기화
        </button>
      )}
    </div>
  );
}
