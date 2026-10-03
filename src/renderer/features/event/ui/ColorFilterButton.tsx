import { useColorFilter } from '@/entities/event';
import { posthog } from '@/shared/lib/posthog';

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
      <ColorChips
        isSelected={(key) => filteredColors.has(key)}
        onSelect={(key) => {
          toggleColor(key);
          posthog.capture('color_filter_toggled', { color_id: key, selected: !filteredColors.has(key) });
        }}
      />
      {isActive && (
        <button
          onClick={() => {
            clearFilter();
            posthog.capture('color_filter_cleared');
          }}
          className="text-muted-foreground hover:text-foreground w-full rounded text-xs transition-colors"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}
