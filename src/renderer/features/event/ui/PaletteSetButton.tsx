import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { COLORPALLETTE, DEFAULT_PALETTE_SET, PALETTE_SET_STORAGE_KEY, PALETTE_SETS, PaletteSetId } from '@/shared/const/color';
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/shared/ui/dropdown-menu';
import { posthog } from '@/shared/lib/posthog';

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
        className="p-0 text-base"
        onClick={(event) => {
          event.preventDefault();
          setIsOpen((prev) => !prev);
        }}
      >
        <span>일정 색상 팔레트</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-(--radix-dropdown-menu-content-available-height) w-auto overflow-y-auto py-2">
        <div className="flex flex-col gap-0.5 px-1">
          {PALETTE_SETS.map((set) => (
            <div key={set.id} onClick={() => handleChange(set.id)} className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors">
              <span className="flex w-3 shrink-0 items-center justify-center">{paletteSet === set.id && <Check strokeWidth={3} size={12} />}</span>
              <div className="flex -space-x-1.5">
                {COLORPALLETTE.map((key) => (
                  <div key={key} className={`h-4 w-4 rounded-full dark:saturate-70 palette-${set.id} event-color-${key} bg-(--event-color)`} />
                ))}
              </div>
              <span className="flex-1 text-sm">{set.label}</span>
            </div>
          ))}
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
