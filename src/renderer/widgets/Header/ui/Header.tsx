import { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { DateProps, ViewMode } from '@/shared/hooks/useDate';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { Tooltip } from '@/shared/ui/tooltip';

import { FlipCalendarButton, FlipFooterButton } from '@/features/flip';
import { RefreshButton } from '@/features/refresh';
import { LoginButton } from '@/features/user';
import { MoveActiveButton, MoveDialog, MoveProvider } from '@/features/move';
import { AskButton } from '@/features/ask';
import { OpacityButton } from '@/features/opacity';
import { DarkModeButton } from '@/features/darkmode';
import { HolidayButton, MaxLanesButton, ColorFilterButton } from '@/features/event';
import { QuitAppButton } from '@/features/quit';
import { ViewModeSwitch } from '@/features/view-mode';

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

type HeaderProps = Pick<DateProps, 'displayMonth' | 'year' | 'weekRangeLabel' | 'handlePrevMonth' | 'handleNextMonth' | 'handlePrevWeek' | 'handleNextWeek'> & {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export function Header({ displayMonth, year, weekRangeLabel, handlePrevMonth, handleNextMonth, handlePrevWeek, handleNextWeek, viewMode, onViewModeChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePrev = viewMode === 'month' ? handlePrevMonth : handlePrevWeek;
  const handleNext = viewMode === 'month' ? handleNextMonth : handleNextWeek;
  const label = viewMode === 'month' ? `${year}년 ${displayMonth.toString().padStart(2, '0')}월` : weekRangeLabel;

  return (
    <MoveProvider>
      <div className="bg-primary text-primary mb-2 flex w-full shrink-0 flex-row items-center justify-between rounded-xl px-6 py-3" style={dragStyle}>
        <div className="flex flex-row items-center p-2" style={noDragStyle}>
          <ChevronLeft strokeWidth={1.25} onClick={handlePrev} />
          <div className="min-w-40 text-center text-xl font-semibold">{label}</div>
          <ChevronRight strokeWidth={1.25} onClick={handleNext} />
        </div>

        <div className="flex items-center gap-4" style={noDragStyle}>
          <ViewModeSwitch viewMode={viewMode} onChange={onViewModeChange} />
          <FlipCalendarButton />
          <RefreshButton />
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <Tooltip content="설정" side="bottom">
              <DropdownMenuTrigger asChild>
                <Settings strokeWidth={1} size={24} />
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="end" className="flex w-auto flex-col gap-1.5 px-3 py-2">
              <LoginButton />
              <MoveActiveButton onStart={() => setMenuOpen(false)} />
              <AskButton />
              <DropdownMenuSeparator />
              <OpacityButton />
              <MaxLanesButton />
              <DarkModeButton />
              <HolidayButton />
              <FlipFooterButton />
              <ColorFilterButton />
              <QuitAppButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <MoveDialog />
    </MoveProvider>
  );
}
