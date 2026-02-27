import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { DateProps } from '@/shared/hooks/useDate';
import { DropDown } from '@/shared/ui/dropdown';

import { FlipCalendarButton, FlipFooterButton } from '@/features/flip';
import { RefreshButton } from '@/features/refresh';
import { LoginButton } from '@/features/user';
import { MoveActiveButton } from '@/features/move';
import { AskButton } from '@/features/ask';
import { OpacityButton } from '@/features/opacity';
import { DarkModeButton } from '@/features/darkmode';
import { HolidayButton } from '@/features/event';
import { QuitAppButton } from '@/features/quit';

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

export function Header({ displayMonth, year, handlePrevMonth, handleNextMonth }: Pick<DateProps, 'displayMonth' | 'year' | 'handlePrevMonth' | 'handleNextMonth'>) {
    return (
        <div className="bg-primary text-primary mb-2 flex w-full flex-row items-center justify-between rounded-xl px-6 py-3" style={dragStyle}>
            <div className="flex flex-row items-center p-2" style={noDragStyle}>
                <ChevronLeft strokeWidth={1.25} onClick={handlePrevMonth} />
                <div className="min-w-40 text-center text-xl font-semibold">
                    {year}년 {displayMonth.toString().padStart(2, '0')}월
                </div>
                <ChevronRight strokeWidth={1.25} onClick={handleNextMonth} />
            </div>

            <div className="flex gap-4" style={noDragStyle}>
                <FlipCalendarButton />
                <RefreshButton />
                <DropDown trigger={<Settings strokeWidth={1} size={24} />} align="right" closeOnClick={false}>
                    {/** 드랍다운 메뉴 */}
                    <LoginButton />
                    <MoveActiveButton />
                    <AskButton />
                    <div className="h-px w-full rounded-full bg-zinc-300"></div>
                    <OpacityButton />
                    <DarkModeButton />
                    <HolidayButton />
                    <FlipFooterButton />
                    <QuitAppButton />
                </DropDown>
            </div>
        </div>
    );
}
