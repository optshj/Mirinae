import { CalendarDays, Columns3 } from 'lucide-react';
import { ViewMode } from '@/shared/hooks/useDate';
import { Tooltip } from '@/shared/ui/tooltip';
import { posthog } from '@/shared/lib/posthog';

interface ViewModeSwitchProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeSwitch({ viewMode, onChange }: ViewModeSwitchProps) {
  const handleChange = (mode: ViewMode) => {
    if (mode === viewMode) return;
    onChange(mode);
    posthog.capture('view_mode_switch', { view_mode: mode });
  };

  return (
    <div className="bg-background-primary flex items-center gap-0.5 rounded-lg p-0.5">
      <Tooltip content="월별 보기" side="bottom">
        <button
          type="button"
          aria-pressed={viewMode === 'month'}
          onClick={() => handleChange('month')}
          className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${viewMode === 'month' ? 'bg-primary text-primary' : 'text-secondary'}`}
        >
          <CalendarDays strokeWidth={1.25} size={18} />
        </button>
      </Tooltip>
      <Tooltip content="주별 보기" side="bottom">
        <button
          type="button"
          aria-pressed={viewMode === 'week'}
          onClick={() => handleChange('week')}
          className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${viewMode === 'week' ? 'bg-primary text-primary' : 'text-secondary'}`}
        >
          <Columns3 strokeWidth={1.25} size={18} />
        </button>
      </Tooltip>
    </div>
  );
}
