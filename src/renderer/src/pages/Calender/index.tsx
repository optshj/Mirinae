import { useDate } from '@/shared/lib/useDate'

import { Header } from '@/widgets/Header'
import { Footer } from '@/widgets/Footer'
import { CalendarGrid } from '@/widgets/Calendar'
import { PatchNoteModal } from '@/entities/patchNote'

export function Calendar() {
    const { days, month, displayMonth, year, handlePrevMonth, handleNextMonth } = useDate()

    return (
        <div className="flex flex-col items-center">
            <Header displayMonth={displayMonth} year={year} handleNextMonth={handleNextMonth} handlePrevMonth={handlePrevMonth} />
            <div id="calendar-container">
                <CalendarGrid days={days} month={month} />
                <Footer />
            </div>
            <PatchNoteModal />
        </div>
    )
}
