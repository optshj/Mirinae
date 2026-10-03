import { usePreference } from '@/shared/lib/preferences';

import { ColorChips } from './components/ColorChips';

export function ColorFilterButton() {
  const [colorFilter, setColorFilter] = usePreference('colorFilter');
  const isActive = colorFilter.length > 0;
  const toggleColor = (colorId: string) => setColorFilter(colorFilter.includes(colorId) ? colorFilter.filter((id) => id !== colorId) : [...colorFilter, colorId]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span>색상 필터</span>
        {isActive && <span className="text-muted-foreground text-xs">{colorFilter.length}개</span>}
      </div>
      <ColorChips isSelected={(key) => colorFilter.includes(key)} onSelect={toggleColor} />
      {isActive && (
        <button onClick={() => setColorFilter([])} className="text-muted-foreground hover:text-foreground w-full rounded text-xs transition-colors">
          필터 초기화
        </button>
      )}
    </div>
  );
}
