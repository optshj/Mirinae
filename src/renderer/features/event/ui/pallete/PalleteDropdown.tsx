import DropDown from '@/shared/ui/dropdown';
import { Check, Palette } from 'lucide-react';

interface PalleteDropdownProps {
    colorId: string;
    onColorIdChange: (colorId: string) => void;
}
export function PalleteDropdown({ colorId, onColorIdChange }: PalleteDropdownProps) {
    return (
        <>
            <DropDown
                trigger={
                    <button
                        className={`relative flex h-7 w-7 items-center justify-center rounded-full border border-white/30 shadow-md transition-all hover:scale-110 event-color-${colorId} bg-[var(--event-color)]`}
                    >
                        <Palette className="h-3.5 w-3.5 text-white" />
                    </button>
                }
            >
                <div className="grid grid-cols-6 gap-2 px-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map((key) => (
                        <div
                            key={key}
                            className={`flex h-5 w-5 items-center justify-center rounded-full transition-all hover:scale-150 dark:saturate-70 event-color-${key} bg-[var(--event-color)]`}
                            onClick={() => onColorIdChange(key)}
                        >
                            {colorId === key && <Check className="text-white" strokeWidth={3} size={12} />}
                        </div>
                    ))}
                </div>
            </DropDown>
        </>
    );
}
