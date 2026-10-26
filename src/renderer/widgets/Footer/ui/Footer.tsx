import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { PalletteDropdown } from './PalletteDropdown';
import { FooterEvent, useCalendarItems } from '@/entities/event';
import { COLOR_STORAGE_KEY } from '@/shared/const/color';

export function Footer() {
  const { items } = useCalendarItems();
  const [colorId, setColorId] = useState<string>(localStorage.getItem(COLOR_STORAGE_KEY) ?? '11');
  const [tomorrow, setTomorrow] = useState(() => dayjs().add(1, 'day').startOf('day').toDate());

  // 매일 자정마다 tomorrow 상태를 업데이트하여 오늘과 내일 일정을 정확히 구분할 수 있도록 함
  useEffect(() => {
    const msUntilMidnight = dayjs().endOf('day').diff(dayjs()) + 1;

    const timeout = setTimeout(() => {
      setTomorrow(dayjs().add(1, 'day').startOf('day').toDate());
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [tomorrow]);

  const todayEvent = useMemo(
    () =>
      items.filter((event) => {
        if (event.category === 'time') return dayjs(event.start.dateTime).isSame(dayjs(), 'day');
        else return dayjs(event.start.date).isSame(dayjs(), 'day');
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
    <footer className="bg-surface border-surface grid h-48 grid-cols-3 overflow-hidden rounded-b-xl border-t transition-[height,opacity,visibility,border-width] duration-300 ease-in-out [html.flip-footer_&]:pointer-events-none [html.flip-footer_&]:invisible [html.flip-footer_&]:h-0 [html.flip-footer_&]:border-t-0 [html.flip-footer_&]:opacity-0">
      <FooterEvent items={todayEvent} hideDate title="오늘 일정" description="오늘의 일정이 없습니다" />
      <FooterEvent items={upcomingEvent} title="다가오는 일정" description="다가오는 일정이 없습니다" />
      <FooterEvent items={importantEvent} title={<PalletteDropdown colorId={colorId} setColorId={setColorId} />} description="선택한 색상의 일정이 표시됩니다" />
    </footer>
  );
}
