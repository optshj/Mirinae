import { useMemo, useState } from 'react';
import { FooterEvent, useCalendarItems } from '@/entities/event';
import { PalletteDropdown } from '@/features/event';

import { isSameDay } from '@/shared/lib/dateFunction';
import { COLOR_STORAGE_KEY } from '@/shared/const/color';

export function Footer() {
  const { items } = useCalendarItems();
  const [colorId, setColorId] = useState<string>(localStorage.getItem(COLOR_STORAGE_KEY) ?? '11');

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  const todayEvent = useMemo(
    () =>
      items.filter((event) => {
        if (event.category === 'time') {
          return isSameDay(new Date(event.start.dateTime), new Date());
        } else {
          return isSameDay(new Date(event.start.date), new Date());
        }
      }),
    [items]
  );

  const upcomingEvent = useMemo(
    () =>
      items.filter((event) => {
        const start = event.category === 'time' ? new Date(event.start.dateTime) : new Date(event.start.date);
        return start >= tomorrow;
      }),
    [items, tomorrow]
  );

  const importantEvent = useMemo(() => upcomingEvent.filter((event) => event.colorId === colorId), [upcomingEvent, colorId]);

  return (
    <footer className="mt-2 grid h-48 grid-cols-3 gap-2 transition-all duration-300 ease-in-out [html.flip-footer_&]:pointer-events-none [html.flip-footer_&]:mt-0 [html.flip-footer_&]:h-0 [html.flip-footer_&]:overflow-hidden [html.flip-footer_&]:opacity-0">
      <FooterEvent items={todayEvent} title="오늘의 일정" description="오늘의 일정이 없습니다" />
      <FooterEvent items={upcomingEvent} title="다가오는 일정" description="다가오는 일정이 없습니다" />
      <FooterEvent items={importantEvent} title="중요한 일정" description="중요한 일정이 표시됩니다" headerButton={<PalletteDropdown colorId={colorId} setColorId={setColorId} />} />
    </footer>
  );
}
