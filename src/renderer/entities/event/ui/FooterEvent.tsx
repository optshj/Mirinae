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

    const handleScrollUp = () => {
        if (canScrollUp) {
            setVisibleStartIndex(visibleStartIndex - 1);
        }
    };
    const handleScrollDown = () => {
        if (canScrollDown) {
            setVisibleStartIndex(visibleStartIndex + 1);
        }
    };

    return (
        <section className="bg-primary relative flex-1 rounded-xl p-4">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-primary font-semibold whitespace-nowrap">{title}</h3>
                    {headerButton}
                </div>

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
                    visibleItems.map((event) => (
                        <div key={event.id} className="flex items-center gap-3 px-3">
                            <span className={`h-2 w-2 rounded-full event-color-${event.colorId} bg-(--event-color)`}></span>
                            <div className="flex flex-col">
                                <span className="text-primary line-clamp-1 font-semibold">{event.summary}</span>
                                <span className="text-font-gray line-clamp-1 text-sm">{isTimeEvent(event) ? formatKoreanDateTime(event.start.dateTime) : formatKoreanDate(event.start.date)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

// 예시 8월 31일 (일) 오전 9:00
export function formatKoreanDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return '';
    } // 잘못된 날짜 처리

    const now = new Date();
    const currentYear = now.getFullYear();

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const isAm = hours < 12;

    const period = isAm ? '오전' : '오후';
    if (hours === 0) {
        hours = 12;
    } else if (hours > 12) {
        hours -= 12;
    }

    // 올해가 아니면 연도 붙이기
    const yearPrefix = year !== currentYear ? `${year}년 ` : '';

    return `${yearPrefix}${month}월 ${day}일 (${weekday}) ${period} ${hours}:${minutes}`;
}

// 예: 2025-09-30 → "9월 30일 (화)"
export function formatKoreanDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return '';
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();

    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];

    return `${month}월 ${day}일 (${weekday})`;
}
