import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function OpacityButton() {
    const [opacity, setOpacity] = useState(1.0)
    useEffect(() => {
        async function fetchOpacity() {
            const initialOpacity = await window.api.getInitialOpacity()
            setOpacity(initialOpacity)
        }
        fetchOpacity()
    }, [])

    return (
        <div className="flex flex-row justify-between">
            <label htmlFor="opacity-slider">투명도</label>
            <div className="flex items-center gap-0.5">
                <Button
                    variant="outline"
                    size="icon"
                    className="size-5"
                    tabIndex={-1}
                    onClick={() => {
                        setOpacity((prev) => {
                            const newOpacity = Math.max(prev - 0.05, 0.2)
                            window.api.setOpacity(newOpacity)
                            return newOpacity
                        })
                    }}
                >
                    <ChevronDown />
                </Button>
                <span className="flex w-9 justify-center text-xs font-semibold">{Math.round(opacity * 100)}%</span>
                <Button
                    variant="outline"
                    size="icon"
                    className="size-5"
                    tabIndex={-1}
                    onClick={() => {
                        setOpacity((prev) => {
                            const newOpacity = Math.min(prev + 0.05, 1.0)
                            window.api.setOpacity(newOpacity)
                            return newOpacity
                        })
                    }}
                >
                    <ChevronUp />
                </Button>
            </div>
        </div>
    )
}
