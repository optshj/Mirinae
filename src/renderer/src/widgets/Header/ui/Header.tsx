import { FlipCalendarButton } from '@/features/flip';
import { RefreshButton } from '@/features/refresh';
import { HeaderDropDown } from './HeaderDropDown';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateProps } from '@/shared/lib/useDate';

export function Header({ displayMonth, year, handlePrevMonth, handleNextMonth }: Pick<DateProps, 'displayMonth' | 'year' | 'handlePrevMonth' | 'handleNextMonth'>) {
    return (
        <div className="bg-primary text-primary mb-2 flex w-full flex-row items-center justify-between rounded-xl px-6 py-3">
            <div className="flex flex-row items-center">
                <div className="p-2">
                    <ChevronLeft strokeWidth={1.25} onClick={handlePrevMonth} />
                </div>
                <div className="min-w-[16d0px] px-4 text-center text-xl font-semibold">
                    {year}년 {displayMonth.toString().padStart(2, '0')}월
                </div>
                <div className="p-2">
                    <ChevronRight strokeWidth={1.25} onClick={handleNextMonth} />
                </div>
            </div>

            <div className="text-primary flex items-center gap-4">
                <FlipCalendarButton />
                <RefreshButton />
                <HeaderDropDown />
            </div>
        </div>
    );
}
