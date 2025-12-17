import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FlipCalendarButton } from '@/features/flip';
import { RefreshButton } from '@/features/refresh';
import { DateProps } from '@/shared/hooks/useDate';
import { HeaderDropDownButton } from './HeaderDropDownButton';

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

export function Header({ displayMonth, year, handlePrevMonth, handleNextMonth }: Pick<DateProps, 'displayMonth' | 'year' | 'handlePrevMonth' | 'handleNextMonth'>) {
    return (
        <div className="bg-primary text-primary mb-2 flex w-full flex-row items-center justify-between rounded-xl px-6 py-3" style={dragStyle}>
            <div className="flex flex-row items-center">
                <div className="p-2" style={noDragStyle}>
                    <ChevronLeft strokeWidth={1.25} onClick={handlePrevMonth} />
                </div>

                <div className="min-w-40 px-4 text-center text-xl font-semibold">
                    {year}년 {displayMonth.toString().padStart(2, '0')}월
                </div>

                <div className="p-2" style={noDragStyle}>
                    <ChevronRight strokeWidth={1.25} onClick={handleNextMonth} />
                </div>
            </div>

            <div className="text-primary flex items-center gap-4">
                <div style={noDragStyle}>
                    <FlipCalendarButton />
                </div>
                <div style={noDragStyle}>
                    <RefreshButton />
                </div>
                <div style={noDragStyle}>
                    <HeaderDropDownButton />
                </div>
            </div>
        </div>
    );
}
