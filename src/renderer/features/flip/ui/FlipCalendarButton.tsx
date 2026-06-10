import { useState } from 'react';
import { FoldVertical, UnfoldVertical } from 'lucide-react';
import { posthog } from '@/shared/lib/posthog';

export function FlipCalendarButton() {
  const [isFlip, setIsFlip] = useState(false);

  const handleClick = () => {
    document.documentElement.classList.toggle('flip-calendar');
    setIsFlip((prev) => !prev);
    posthog.capture('flip_button');
  };
  return <>{isFlip ? <UnfoldVertical strokeWidth={1.0} role="button" size={24} onClick={handleClick} /> : <FoldVertical strokeWidth={1.0} role="button" size={24} onClick={handleClick} />}</>;
}
