import { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { DateProps } from '@/shared/hooks/useDate';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { Tooltip } from '@/shared/ui/tooltip';

import { FlipCalendarButton, FlipFooterButton } from '@/features/flip';
import { MiniViewButton } from '@/features/mini-view';
import { RefreshButton } from '@/features/refresh';
import { LoginButton } from '@/features/user';
import { MoveActiveButton, MoveDialog } from '@/features/move';
import { AskButton } from '@/features/ask';
import { OpacityButton } from '@/features/opacity';
import { DarkModeButton } from '@/features/darkmode';
import { HolidayButton, MaxLanesButton, ColorFilterButton } from '@/features/event';
import { QuitAppButton } from '@/features/quit';

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

export function Header({ displayMonth, year, handlePrevMonth, handleNextMonth }: Pick<DateProps, 'displayMonth' | 'year' | 'handlePrevMonth' | 'handleNextMonth'>) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div
        className="bg-primary text-primary mb-2 flex w-full flex-row items-center justify-between rounded-xl px-6 py-3 transition-all duration-300 ease-in-out [html.mini-view_&]:mb-0 [html.mini-view_&]:rounded-b-none [html.mini-view_&]:px-4 [html.mini-view_&]:py-2.5"
        style={dragStyle}
      >
        <div className="flex flex-row items-center p-2 [html.mini-view_&]:p-0" style={noDragStyle}>
          <ChevronLeft strokeWidth={1.25} onClick={handlePrevMonth} className="[html.mini-view_&]:size-5" />
          <div className="min-w-40 text-center text-xl font-semibold [html.mini-view_&]:min-w-24 [html.mini-view_&]:text-sm">
            {year}년 {displayMonth.toString().padStart(2, '0')}월
          </div>
          <ChevronRight strokeWidth={1.25} onClick={handleNextMonth} className="[html.mini-view_&]:size-5" />
        </div>

        <div className="flex items-center gap-4 [html.mini-view_&]:gap-2.5" style={noDragStyle}>
          <div className="flex items-center gap-4 [html.mini-view_&]:hidden">
            <FlipCalendarButton />
            <RefreshButton />
          </div>
          <MiniViewButton />
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <Tooltip content="설정" side="bottom">
              <DropdownMenuTrigger asChild>
                <button type="button" tabIndex={-1} className="inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 [&_svg]:pointer-events-none">
                  <Settings strokeWidth={1} size={24} className="[html.mini-view_&]:size-5" />
                </button>
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
    </>
  );
}
