import { useEffect, useState } from 'react'
import DropDown from '@/shared/ui/dropdown'
import { getColorById, getPalette } from '../../lib/getColor'
import { Check, Palette } from 'lucide-react'

export function PalleteDropdown() {
    const [colorId, setColorId] = useState<string>('11')
    useEffect(() => {
        async function fetchColor() {
            const saved = await window.api.getInitialColorId()
            setColorId(saved)
        }
        fetchColor()
    }, [])

    const handleColorChange = (newColor: string) => {
        setColorId(newColor)
        window.api.setColorId(newColor)
    }
    const selectedColor = getColorById(colorId).background
    const palette = getPalette()

    return (
        <>
            <DropDown
                trigger={
                    <button
                        className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30"
                        style={{
                            backgroundColor: selectedColor
                        }}
                    >
                        <Palette className="h-3.5 w-3.5 text-white" />
                    </button>
                }
            >
                <div className="grid grid-cols-6 gap-2 px-2">
                    {Object.entries(palette).map(([key, color]) => (
                        <div
                            key={key}
                            className="flex h-5 w-5 items-center justify-center rounded-full transition-all hover:scale-150 dark:saturate-70"
                            style={{ backgroundColor: color.background }}
                            onClick={() => handleColorChange(key)}
                        >
                            {colorId === key && <Check className="text-white" strokeWidth={3} size={12} />}
                        </div>
                    ))}
                </div>
            </DropDown>
        </>
    )
}
