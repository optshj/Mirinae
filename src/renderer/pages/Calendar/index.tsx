import { useState } from 'react';
import { useDate } from '@/shared/hooks/useDate';

import { Header } from '@/widgets/Header';
import { Footer } from '@/widgets/Footer';
import { CalendarGrid, MiniCalendarGrid } from '@/widgets/Calendar';
import { MoveProvider } from '@/features/move';
import { FooterToggleTab } from '@/features/flip';
import { UpdateNotification } from '@/entities/update';

export function Calendar() {
  const { days, month, displayMonth, year, handlePrevMonth, handleNextMonth, isCurrentMonth, handleToday } = useDate();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <MoveProvider container={container}>
      <div
        ref={setContainer}
        className="relative ml-auto rounded-lg outline-4 -outline-offset-4 outline-transparent transition-[width] duration-300 ease-in-out outline-dotted [html.mini-view_&]:w-[28rem] [html.resizable_&]:outline-zinc-500"
      >
        <Header displayMonth={displayMonth} year={year} handleNextMonth={handleNextMonth} handlePrevMonth={handlePrevMonth} isCurrentMonth={isCurrentMonth} handleToday={handleToday} />
        <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out [html.flip-calendar_&]:pointer-events-none [html.flip-calendar_&]:-mt-4 [html.flip-calendar_&]:scale-95 [html.flip-calendar_&]:opacity-0 [html.mini-view_&]:hidden">
          <CalendarGrid days={days} month={month} />
          <Footer />
          <FooterToggleTab />
        </div>
        <div className="hidden [html.mini-view_&]:block">
          <MiniCalendarGrid days={days} month={month} />
        </div>
        <UpdateNotification />
      </div>
    </MoveProvider>
  );
}
