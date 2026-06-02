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
    <div className="flex flex-row justify-between">
      <label htmlFor="flip-footer-toggle">달력만보기</label>
      <Switch id="flip-footer-toggle" onClick={onClick} isOn={isFlip} />
    </div>
  );
}
