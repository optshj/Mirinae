import { COLOR_STORAGE_KEY } from '@/shared/const/color';
import { Palette } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';

import { ColorChips } from './components/ColorChips';

interface PalletteDropdownProps {
  colorId: string;
  setColorId: (colorId: string) => void;
}
export function PalletteDropdown({ colorId, setColorId }: PalletteDropdownProps) {
  const handleColorChange = (newColor: string) => {
    setColorId(newColor);
    localStorage.setItem(COLOR_STORAGE_KEY, newColor);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative flex h-7 w-7 items-center justify-center rounded-full border border-white/30 shadow-md transition-all hover:scale-110 event-color-${colorId} bg-(--event-color) dark:saturate-70`}
        >
          <Palette className="h-3.5 w-3.5 text-white" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 py-2">
        <ColorChips className="px-2" isSelected={(key) => colorId === key} onSelect={handleColorChange} naming={colorId} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
