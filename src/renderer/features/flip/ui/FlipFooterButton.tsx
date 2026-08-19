import { Switch } from '@/shared/ui/switch';
import { useState } from 'react';

export function FlipFooterButton() {
  const [isFlip, setIsFlip] = useState(localStorage.getItem('flipFooter') === 'true');

  const onClick = () => {
    setIsFlip((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('flip-footer', next);
      localStorage.setItem('flipFooter', next.toString());
      return next;
    });
  };

  return (
    <div className="flex flex-row items-center justify-between gap-4">
      <label htmlFor="flip-footer-toggle">일정 요약 숨기기</label>
      <Switch id="flip-footer-toggle" onClick={onClick} isOn={isFlip} />
    </div>
  );
}
