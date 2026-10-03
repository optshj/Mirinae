import { useState } from 'react';
import { CalendarDays, LayoutPanelTop, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { posthog } from '@/shared/lib/posthog';

export function FlipFooterButton() {
  const [isFlip, setIsFlip] = useState(localStorage.getItem('flipFooter') === 'true');

  const selectLayout = (flip: boolean) => {
    if (flip === isFlip) return;
    setIsFlip(flip);
    document.documentElement.classList.toggle('flip-footer', flip);
    localStorage.setItem('flipFooter', flip.toString());
    posthog.capture('flip_footer_changed', { flip_footer: flip });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span>화면 구성</span>
      <div className="flex gap-2">
        <LayoutOption icon={LayoutPanelTop} label="달력 + 요약" selected={!isFlip} onClick={() => selectLayout(false)} />
        <LayoutOption icon={CalendarDays} label="달력만" selected={isFlip} onClick={() => selectLayout(true)} />
      </div>
    </div>
  );
}

function LayoutOption({ icon: Icon, label, selected, onClick }: { icon: LucideIcon; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-lg border-2 px-1 pt-2.5 pb-1.5 transition-colors',
        selected ? 'border-main-color bg-main-color/20' : 'border-primary hover:bg-main-color/10'
      )}
    >
      <Icon size={26} strokeWidth={1.5} className="text-secondary" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
