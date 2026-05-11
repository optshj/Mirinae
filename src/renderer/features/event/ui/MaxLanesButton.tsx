import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useMaxLanes } from '@/entities/event';

export function MaxLanesButton() {
  const { maxLanes, setMaxLanes } = useMaxLanes();

  return (
    <div className="flex flex-row justify-between">
      <label htmlFor="max-lanes-slider">일정표시</label>
      <div className="flex items-center gap-0.5">
        <Button
          variant="outline"
          size="icon"
          className="size-5"
          tabIndex={-1}
          onClick={() => {
            setMaxLanes(Math.max(maxLanes - 1, 1));
          }}
        >
          <ChevronDown />
        </Button>
        <span className="flex w-8 justify-center text-xs">{maxLanes}개</span>
        <Button
          variant="outline"
          size="icon"
          className="size-5"
          tabIndex={-1}
          onClick={() => {
            setMaxLanes(Math.min(maxLanes + 1, 5));
          }}
        >
          <ChevronUp />
        </Button>
      </div>
    </div>
  );
}
