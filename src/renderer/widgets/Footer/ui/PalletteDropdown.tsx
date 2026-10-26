import { COLOR_STORAGE_KEY } from '@/shared/const/color';
import { ChevronDown } from 'lucide-react';
import { useColorLabels } from '@/entities/event';
import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';

import { ColorChips } from '@/features/event';

interface PalletteDropdownProps {
  colorId: string;
  setColorId: (colorId: string) => void;
}
export function PalletteDropdown({ colorId, setColorId }: PalletteDropdownProps) {
  const { labels } = useColorLabels();

  const handleColorChange = (newColor: string) => {
    setColorId(newColor);
    localStorage.setItem(COLOR_STORAGE_KEY, newColor);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" tabIndex={-1} className="text-primary -ml-2 h-7 min-w-0 gap-1.5 px-2 font-semibold data-[state=open]:bg-neutral-100 dark:data-[state=open]:bg-neutral-800">
          <span className={`event-color-${colorId} size-2.5 shrink-0 rounded-full bg-(--event-color) dark:saturate-70`} />
          <span className="truncate text-sm">{labels[colorId] || '색상별 일정'}</span>
          <ChevronDown className="text-secondary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56 py-2">
        <ColorChips className="px-2" isSelected={(key) => colorId === key} onSelect={handleColorChange} naming={colorId} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
