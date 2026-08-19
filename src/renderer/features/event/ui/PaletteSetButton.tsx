import { useEffect, useState } from 'react';
import { COLORPALLETTE, DEFAULT_PALETTE_SET, PALETTE_SET_STORAGE_KEY, PALETTE_SETS, PaletteSetId } from '@/shared/const/color';
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/shared/ui/dropdown-menu';
import { posthog } from '@/shared/lib/posthog';
import { cn } from '@/shared/lib/utils';

function isPaletteSetId(value: string | null): value is PaletteSetId {
  return PALETTE_SETS.some((set) => set.id === value);
}

export function PaletteSetButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [paletteSet, setPaletteSet] = useState<PaletteSetId>(() => {
    const stored = localStorage.getItem(PALETTE_SET_STORAGE_KEY);
    return isPaletteSetId(stored) ? stored : DEFAULT_PALETTE_SET;
  });

  useEffect(() => {
    PALETTE_SETS.forEach((set) => document.documentElement.classList.toggle(`palette-${set.id}`, set.id === paletteSet));
  }, [paletteSet]);

  const handleChange = (id: PaletteSetId) => {
    setPaletteSet(id);
    localStorage.setItem(PALETTE_SET_STORAGE_KEY, id);
    posthog.capture('palette_set_change', { palette_set: id });
  };

  return (
    <DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuSubTrigger
        className="p-0"
        onClick={(event) => {
          event.preventDefault();
          setIsOpen((prev) => !prev);
        }}
      >
        <span>캘린더 팔레트</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-(--radix-dropdown-menu-content-available-height) w-auto overflow-y-auto py-2">
        <div className="grid grid-cols-2 gap-1.5 px-1.5">
          {PALETTE_SETS.map((set) => (
            <div
              key={set.id}
              onClick={() => handleChange(set.id)}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-2.5 text-center transition-colors',
                paletteSet === set.id ? 'border-main-color bg-main-color/20' : 'border-primary hover:bg-main-color/10'
              )}
            >
              <div className="flex -space-x-1.5">
                {COLORPALLETTE.map((key) => (
                  <div key={key} className={`h-3.5 w-3.5 rounded-full dark:saturate-70 palette-${set.id} event-color-${key} bg-(--event-color)`} />
                ))}
              </div>
              <span className="text-xs">{set.label}</span>
            </div>
          ))}
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
