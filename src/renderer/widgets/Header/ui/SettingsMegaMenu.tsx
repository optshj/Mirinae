import { useState, type ComponentType } from 'react';
import { Calendar, CircleHelp, Monitor, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

import { LoginButton } from '@/features/user';
import { MoveActiveButton } from '@/features/move';
import { GuideButton } from '@/features/guide';
import { AskButton } from '@/features/ask';
import { OpacityButton } from '@/features/opacity';
import { DarkModeButton } from '@/features/darkmode';
import { NotificationSettingButton } from '@/features/event-notification';
import { HolidayButton, MaxLanesButton, PaletteSetButton, ColorFilterButton } from '@/features/event';
import { FlipFooterButton } from '@/features/flip';
import { QuitAppButton } from '@/features/quit';

type CategoryId = 'general' | 'display' | 'calendar' | 'support';

interface Category {
  id: CategoryId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const CATEGORIES: Category[] = [
  { id: 'general', label: '일반', icon: SlidersHorizontal },
  { id: 'display', label: '화면', icon: Monitor },
  { id: 'calendar', label: '캘린더', icon: Calendar },
  { id: 'support', label: '지원', icon: CircleHelp }
];

interface SettingsMegaMenuProps {
  // 화면조절(드래그) 시작 시 부모(드롭다운)를 닫기 위한 콜백
  onMoveStart?: () => void;
}

export function SettingsMegaMenu({ onMoveStart }: SettingsMegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general');

  return (
    <div className="flex w-72">
      <div className="border-primary flex w-20 shrink-0 flex-col gap-1 border-r p-2">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              type="button"
              tabIndex={-1}
              onClick={() => setActiveCategory(id)}
              onKeyDown={(event) => event.preventDefault()}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg py-2 text-center text-xs leading-none transition-colors',
                isActive ? 'bg-accent text-accent-foreground font-semibold' : 'text-secondary hover:bg-accent/40 hover:text-primary'
              )}
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3 text-sm">
        {activeCategory === 'general' && (
          <>
            <LoginButton />
            <MoveActiveButton onStart={onMoveStart} />
            <FlipFooterButton />
            <NotificationSettingButton />
            <QuitAppButton />
          </>
        )}
        {activeCategory === 'display' && (
          <>
            <OpacityButton />
            <DarkModeButton />
          </>
        )}
        {activeCategory === 'calendar' && (
          <>
            <MaxLanesButton />
            <HolidayButton />
            <PaletteSetButton />
            <ColorFilterButton />
          </>
        )}
        {activeCategory === 'support' && (
          <>
            <GuideButton />
            <AskButton />
          </>
        )}
      </div>
    </div>
  );
}
