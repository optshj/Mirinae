import { useState } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { posthog } from '@/shared/lib/posthog';
import { Tooltip } from '@/shared/ui/tooltip';

export function MiniViewButton() {
  const [isMini, setIsMini] = useState(localStorage.getItem('miniView') === 'true');

  const handleClick = () => {
    setIsMini((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('mini-view', next);
      localStorage.setItem('miniView', next.toString());
      posthog.capture('mini_view_button');
      return next;
    });
  };

  return (
    <Tooltip content={isMini ? '캘린더 확대' : '캘린더 미니뷰'} side="bottom">
      <button type="button" tabIndex={-1} onClick={handleClick} className="inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 [&_svg]:pointer-events-none">
        {isMini ? <Maximize2 strokeWidth={1.0} size={24} className="[html.mini-view_&]:size-5" /> : <Minimize2 strokeWidth={1.0} size={24} className="[html.mini-view_&]:size-5" />}
      </button>
    </Tooltip>
  );
}
