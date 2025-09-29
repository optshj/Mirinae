import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { formatKoreanDateTime } from '@/shared/lib/dateFunction'
import { EventItemWithColor } from '@/shared/types/EventTypes'
import { Button } from '@/shared/ui/button'

interface FooterEventProps {
    items: EventItemWithColor[]
    title: string
    description: string
}
export function FooterEvent({ items, title, description }: FooterEventProps) {
    const [visibleStartIndex, setVisibleStartIndex] = useState(0)

    const showCount = 2
    const canScrollUp = visibleStartIndex > 0
    const canScrollDown = visibleStartIndex < items.length - showCount

    const visibleItems = items.slice(visibleStartIndex, visibleStartIndex + showCount)

    const handleScrollUp = () => {
        if (canScrollUp) setVisibleStartIndex(visibleStartIndex - 1)
    }
    const handleScrollDown = () => {
        if (canScrollDown) setVisibleStartIndex(visibleStartIndex + 1)
    }

    return (
        <section className="bg-primary relative flex-1 rounded-xl p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-primary font-semibold whitespace-nowrap">{title}</h3>

                <div className="flex flex-row">
                    <Button onClick={handleScrollUp} disabled={!canScrollUp} variant="ghost" size="icon" tabIndex={-1}>
                        <ChevronUp />
                    </Button>
                    <Button onClick={handleScrollDown} disabled={!canScrollDown} variant="ghost" size="icon" tabIndex={-1}>
                        <ChevronDown />
                    </Button>
                </div>
            </div>

            <div className="flex max-h-30 flex-col gap-4">
                {items.length === 0 ? (
                    <span className="text-font-gray py-8 text-center whitespace-nowrap">{description}</span>
                ) : (
                    visibleItems.map((event, i) => (
                        <div key={visibleStartIndex + i} className="flex items-center gap-3 px-3">
                            <span className="h-2 w-2 rounded-full" style={{ background: event.color.background }}></span>
                            <div className="flex flex-col">
                                <span className="text-primary line-clamp-1 font-semibold">{event.summary}</span>
                                <span className="text-font-gray line-clamp-1 text-sm">{formatKoreanDateTime(event.start.dateTime)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}
