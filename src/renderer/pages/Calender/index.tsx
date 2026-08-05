import { useState } from 'react';
import { useDate } from '@/shared/hooks/useDate';

import { Header } from '@/widgets/Header';
import { Footer } from '@/widgets/Footer';
import { CalendarGrid, MiniCalendarGrid } from '@/widgets/Calendar';
import { MoveProvider } from '@/features/move';
import { PatchNoteModal } from '@/entities/patchNote';
import { UpdateNotification } from '@/entities/update';

export function Calendar() {
  const { days, month, displayMonth, year, handlePrevMonth, handleNextMonth } = useDate();
  // MoveDialog가 뷰포트가 아니라 실제 보이는 캘린더 박스(미니뷰 포함) 기준으로 뜨도록 포탈 컨테이너로 전달한다.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <MoveProvider container={container}>
      <div
        ref={setContainer}
        className="relative ml-auto rounded-lg outline-4 -outline-offset-4 outline-transparent transition-[width] duration-300 ease-in-out outline-dotted [html.mini-view_&]:w-96 [html.resizable_&]:outline-zinc-500"
      >
        <Header displayMonth={displayMonth} year={year} handleNextMonth={handleNextMonth} handlePrevMonth={handlePrevMonth} />
        <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out [html.flip-calendar_&]:pointer-events-none [html.flip-calendar_&]:-mt-4 [html.flip-calendar_&]:scale-95 [html.flip-calendar_&]:opacity-0 [html.mini-view_&]:hidden">
          <CalendarGrid days={days} month={month} />
          <Footer />
        </div>
        <div className="hidden [html.mini-view_&]:block">
          <MiniCalendarGrid days={days} month={month} />
        </div>
        <PatchNoteModal />
        <UpdateNotification />
      </div>
    </MoveProvider>
  );
}
