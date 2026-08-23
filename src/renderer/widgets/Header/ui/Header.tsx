import { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { DateProps } from '@/shared/hooks/useDate';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { Tooltip } from '@/shared/ui/tooltip';

import { FlipCalendarButton } from '@/features/flip';
import { MiniViewButton } from '@/features/mini-view';
import { RefreshButton } from '@/features/refresh';
import { GuideButton } from '@/features/guide';
import { MoveDialog } from '@/features/move';

import { SettingsMegaMenu } from './SettingsMegaMenu';

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

export function Header({ displayMonth, year, handlePrevMonth, handleNextMonth }: Pick<DateProps, 'displayMonth' | 'year' | 'handlePrevMonth' | 'handleNextMonth'>) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div
        className="bg-primary text-primary mb-2 flex w-full flex-row items-center justify-between rounded-xl px-6 py-3 transition-all duration-300 ease-in-out [html.mini-view_&]:mb-0 [html.mini-view_&]:rounded-b-none [html.mini-view_&]:px-5 [html.mini-view_&]:py-3"
        style={dragStyle}
      >
        <div className="flex flex-row items-center p-2 [html.mini-view_&]:p-0" style={noDragStyle}>
          <ChevronLeft strokeWidth={1.25} onClick={handlePrevMonth} className="[html.mini-view_&]:size-6" />
          <div className="min-w-40 text-center text-xl font-semibold [html.mini-view_&]:min-w-28 [html.mini-view_&]:text-base">
            {year}년 {displayMonth.toString().padStart(2, '0')}월
          </div>
          <ChevronRight strokeWidth={1.25} onClick={handleNextMonth} className="[html.mini-view_&]:size-6" />
        </div>

        <div className="flex items-center gap-4 [html.mini-view_&]:gap-3" style={noDragStyle}>
          <div className="flex items-center gap-4 [html.mini-view_&]:hidden">
            <FlipCalendarButton />
            <RefreshButton />
          </div>
          <MiniViewButton />
          <div className="flex items-center gap-4">
            <div className="bg-current h-3.5 w-px opacity-15" />
            <GuideButton />
          </div>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <Tooltip content="설정" side="bottom">
              <DropdownMenuTrigger asChild>
                <div role="button" tabIndex={-1} className="inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 [&_svg]:pointer-events-none">
                  <Settings strokeWidth={1} size={24} className="[html.mini-view_&]:size-6" />
                </div>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-auto p-0">
              <SettingsMegaMenu onMoveStart={() => setMenuOpen(false)} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <MoveDialog />
    </>
  );
}
