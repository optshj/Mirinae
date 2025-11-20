import { useDate } from '@/shared/lib/useDate';

import { Header } from '@/widgets/Header';
import { Footer } from '@/widgets/Footer';
import { CalendarGrid } from '@/widgets/Calendar';
import { PatchNoteModal } from '@/entities/patchNote';

export function Calendar() {
    const { days, month, displayMonth, year, handlePrevMonth, handleNextMonth } = useDate();

    return (
        <div className="[html.disable-click_&]:pointer-events-none [html.resizable_&]:box-border [html.resizable_&]:border-4 [html.resizable_&]:border-dotted [html.resizable_&]:border-[#e0e0e0] [html.resizable_&]:pb-4">
            <Header displayMonth={displayMonth} year={year} handleNextMonth={handleNextMonth} handlePrevMonth={handlePrevMonth} />
            <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out [html.flip-calendar_&]:pointer-events-none [html.flip-calendar_&]:-mt-4 [html.flip-calendar_&]:scale-95 [html.flip-calendar_&]:opacity-0">
                <CalendarGrid days={days} month={month} />
                <Footer />
            </div>
            <PatchNoteModal />
        </div>
    );
}
