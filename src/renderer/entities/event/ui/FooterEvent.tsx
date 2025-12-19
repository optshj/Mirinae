import dayjs from 'dayjs';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CalendarEvent, isTimeEvent } from '@/shared/types/EventType';

interface FooterEventProps {
    items: CalendarEvent[];
    title: string;
    description: string;
    headerButton?: React.ReactNode;
}

export function FooterEvent({ items, title, description, headerButton }: FooterEventProps) {
    const [visibleStartIndex, setVisibleStartIndex] = useState(0);
    const showCount = 2;

    const canScrollUp = visibleStartIndex > 0;
    const canScrollDown = visibleStartIndex < items.length - showCount;
    const visibleItems = items.slice(visibleStartIndex, visibleStartIndex + showCount);

    const handleScrollUp = () => canScrollUp && setVisibleStartIndex((prev) => prev - 1);
    const handleScrollDown = () => canScrollDown && setVisibleStartIndex((prev) => prev + 1);

    return (
        <section className="bg-primary relative flex-1 rounded-xl p-4">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-primary font-semibold whitespace-nowrap">{title}</h3>
                    {headerButton}
                </div>

                <div className="flex">
                    <Button onClick={handleScrollUp} disabled={!canScrollUp} variant="ghost" size="icon" tabIndex={-1}>
                        <ChevronUp size={20} />
                    </Button>
                    <Button onClick={handleScrollDown} disabled={!canScrollDown} variant="ghost" size="icon" tabIndex={-1}>
                        <ChevronDown size={20} />
                    </Button>
                </div>
            </div>

            <div className="flex max-h-30 flex-col gap-4">
                {items.length === 0 ? (
                    <span className="text-font-gray py-8 text-center whitespace-nowrap">{description}</span>
                ) : (
                    visibleItems.map((event) => (
                        <div key={event.id} className="flex items-center gap-3 px-3">
                            <span className={`h-2 w-2 rounded-full event-color-${event.colorId} bg-(--event-color)`} />
                            <div className="flex flex-col">
                                <span className="text-primary line-clamp-1 font-semibold">{event.summary}</span>
                                <span className="text-font-gray line-clamp-1 text-sm">{formatKorean(event)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

function formatKorean(event: CalendarEvent): string {
    const isTime = isTimeEvent(event);
    const dateVal = isTime ? event.start.dateTime : event.start.date;

    if (!dateVal) {
        return '';
    }

    const d = dayjs(dateVal);
    const now = dayjs();
    const yearFormat = d.year() !== now.year() ? 'YYYY년 ' : '';
    const dateFormat = `${yearFormat}M월 D일 (ddd)`;

    return isTime ? d.format(`${dateFormat} A h:mm`) : d.format(dateFormat);
}
