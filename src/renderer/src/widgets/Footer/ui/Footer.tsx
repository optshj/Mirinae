import { useEffect, useMemo, useState } from 'react';
import { FooterEvent } from '@/entities/event';
import { PalleteDropdown, useCalendarItems } from '@/features/event';
import { isSameDay } from '@/shared/lib/dateFunction';
import { isTimeEvent } from '@/shared/types/EventType';

export function Footer() {
    const { items } = useCalendarItems();
    const [colorId, setColorId] = useState<string>('11');

    useEffect(() => {
        async function fetchColor() {
            const saved = await window.api.getInitialColorId();
            setColorId(saved);
        }
        fetchColor();

        const unsubscribe = window.api.onColorIdChange((newColor) => {
            setColorId(newColor);
        });
        return unsubscribe;
    }, []);

    const tomorrow = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 1);
        return date;
    }, []);

    const todayEvent = useMemo(
        () =>
            items.filter((event) => {
                if (isTimeEvent(event)) {
                    return isSameDay(new Date(event.start.dateTime), new Date());
                } else {
                    return isSameDay(new Date(event.start.date), new Date());
                }
            }),
        [items]
    );

    const upcomingEvent = useMemo(
        () =>
            items
                .filter((event) => {
                    const start = isTimeEvent(event) ? new Date(event.start.dateTime) : new Date(event.start.date);
                    return start >= tomorrow;
                })
                .sort((a, b) => {
                    const aStart = isTimeEvent(a) ? new Date(a.start.dateTime).getTime() : new Date(a.start.date).getTime();
                    const bStart = isTimeEvent(b) ? new Date(b.start.dateTime).getTime() : new Date(b.start.date).getTime();
                    return aStart - bStart;
                }),
        [items, tomorrow]
    );

    const importantEvent = useMemo(() => upcomingEvent.filter((event) => event.colorId === colorId), [upcomingEvent, colorId]);

    return (
        <aside className="mt-2 grid h-48 grid-cols-3 gap-2 transition-all duration-300 ease-in-out [html.flip-footer_&]:pointer-events-none [html.flip-footer_&]:mt-0 [html.flip-footer_&]:h-0 [html.flip-footer_&]:overflow-hidden [html.flip-footer_&]:opacity-0">
            <FooterEvent items={todayEvent} title="오늘의 일정" description="오늘의 일정이 없습니다" />
            <FooterEvent items={upcomingEvent} title="다가오는 일정" description="다가오는 일정이 없습니다" />
            <FooterEvent items={importantEvent} title="중요한 일정" description="중요한 일정이 표시됩니다" headerButton={<PalleteDropdown />} />
        </aside>
    );
}
