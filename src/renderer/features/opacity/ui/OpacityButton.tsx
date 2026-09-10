import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { posthog } from '@/shared/lib/posthog';

export function OpacityButton() {
  const [opacity, setOpacity] = useState(1.0);

  useEffect(() => {
    async function fetchOpacity() {
      const initialOpacity = await window.api.getInitialOpacity();
      setOpacity(initialOpacity);
    }
    fetchOpacity();
  }, []);

  const changeOpacity = (delta: number) => {
    const newOpacity = Math.min(Math.max(opacity + delta, 0.2), 1.0);
    setOpacity(newOpacity);
    window.api.setOpacity(newOpacity);
    posthog.capture('opacity_changed', { opacity: newOpacity });
  };

  return (
    <div className="flex flex-row justify-between">
      <label htmlFor="opacity-slider">투명도</label>
      <div className="flex items-center gap-0.5">
        <Button variant="outline" size="icon" className="size-5" tabIndex={-1} onClick={() => changeOpacity(-0.05)}>
          <ChevronDown />
        </Button>
        <span className="flex w-9 justify-center text-xs font-semibold">{Math.round(opacity * 100)}%</span>
        <Button variant="outline" size="icon" className="size-5" tabIndex={-1} onClick={() => changeOpacity(0.05)}>
          <ChevronUp />
        </Button>
      </div>
    </div>
  );
}
