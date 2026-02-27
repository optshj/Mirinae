import { DropDown } from '@/shared/ui/dropdown';
import { COLOR_STORAGE_KEY, COLORPALLETTE } from '@/shared/const/color';
import { Check, Palette } from 'lucide-react';

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
    <>
      <DropDown
        trigger={
          <button
            className={`relative flex h-7 w-7 items-center justify-center rounded-full border border-white/30 shadow-md transition-all hover:scale-110 event-color-${colorId} bg-(--event-color) dark:saturate-70`}
          >
            <Palette className="h-3.5 w-3.5 text-white" />
          </button>
        }
      >
        <div className="grid grid-cols-6 gap-2 px-2">
          {COLORPALLETTE.map((key) => (
            <div
              key={key}
              className={`flex h-5 w-5 items-center justify-center rounded-full transition-all hover:scale-150 dark:saturate-70 event-color-${key} bg-(--event-color)`}
              onClick={() => handleColorChange(key)}
            >
              {colorId === key && <Check className="text-white" strokeWidth={3} size={12} />}
            </div>
          ))}
        </div>
      </DropDown>
    </>
  );
}
