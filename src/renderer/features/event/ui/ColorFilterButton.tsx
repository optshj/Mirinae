import { useColorFilter } from '@/entities/event';
import { COLORPALLETTE } from '@/shared/const/color';
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/shared/ui/dropdown-menu';
import { Check } from 'lucide-react';

export function ColorFilterButton() {
  const { filteredColors, toggleColor, clearFilter } = useColorFilter();
  const isActive = filteredColors.size > 0;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="p-0 text-base">
        <span>일정 필터링</span>
        {isActive && <span className="text-muted-foreground ml-auto text-xs">{filteredColors.size}개</span>}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-auto py-2">
        <div className="grid grid-cols-6 gap-2 px-2">
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
          <div className="mt-2 px-2">
            <button onClick={clearFilter} className="text-muted-foreground hover:text-foreground w-full rounded text-xs transition-colors">
              필터 초기화
            </button>
          </div>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
