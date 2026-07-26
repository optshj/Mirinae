import { useEffect, useState } from 'react';
import { useDate, ViewMode } from '@/shared/hooks/useDate';

import { Header } from '@/widgets/Header';
import { Footer } from '@/widgets/Footer';
import { CalendarGrid } from '@/widgets/Calendar';
import { WeekCalendarGrid } from '@/widgets/WeekCalendar';

export function Calendar() {
  const { days, weekDays, month, displayMonth, year, weekRangeLabel, handlePrevMonth, handleNextMonth, handlePrevWeek, handleNextWeek } = useDate();
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  useEffect(() => {
    window.api.getViewMode().then((mode) => {
      if (mode) setViewMode(mode);
    });
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    window.api.setViewMode(mode);
  };

  return (
    <div className="relative flex h-screen flex-col rounded-lg">
      <Header
        displayMonth={displayMonth}
        year={year}
        weekRangeLabel={weekRangeLabel}
        handleNextMonth={handleNextMonth}
        handlePrevMonth={handlePrevMonth}
        handleNextWeek={handleNextWeek}
        handlePrevWeek={handlePrevWeek}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
      <div className="flex min-h-0 flex-1 flex-col transition-all duration-300 ease-in-out [html.flip-calendar_&]:pointer-events-none [html.flip-calendar_&]:-mt-4 [html.flip-calendar_&]:scale-95 [html.flip-calendar_&]:opacity-0">
        {viewMode === 'month' ? <CalendarGrid days={days} month={month} /> : <WeekCalendarGrid weekDays={weekDays} />}
        <Footer />
      </div>
      {/* 리사이즈 핸들 표시용 오버레이. 자식들의 stacking context 위에 항상 보이도록 별도 레이어로 분리 */}
      <div className="pointer-events-none absolute inset-0 rounded-lg outline-4 -outline-offset-4 outline-transparent outline-dotted [html.resizable_&]:outline-zinc-500" />
    </div>
  );
}
