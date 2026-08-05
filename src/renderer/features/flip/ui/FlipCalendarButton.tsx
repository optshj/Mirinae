import { useState } from 'react';
import { FoldVertical, UnfoldVertical } from 'lucide-react';
import { posthog } from '@/shared/lib/posthog';
import { Tooltip } from '@/shared/ui/tooltip';

export function FlipCalendarButton() {
  const [isFlip, setIsFlip] = useState(false);

  const handleClick = () => {
    document.documentElement.classList.toggle('flip-calendar');
    setIsFlip((prev) => !prev);
    posthog.capture('flip_button');
  };
  return (
    <Tooltip content={isFlip ? '캘린더 펼치기' : '캘린더 접기'} side="bottom">
      <button type="button" tabIndex={-1} onClick={handleClick} className="inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 [&_svg]:pointer-events-none">
        {isFlip ? <UnfoldVertical strokeWidth={1.0} size={24} /> : <FoldVertical strokeWidth={1.0} size={24} />}
      </button>
    </Tooltip>
  );
}
