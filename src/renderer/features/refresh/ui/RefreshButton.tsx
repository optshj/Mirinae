import { RotateCw } from 'lucide-react';
import { Tooltip } from '@/shared/ui/tooltip';

export function RefreshButton() {
  return (
    <Tooltip content="새로고침" side="bottom">
      <button type="button" tabIndex={-1} onClick={() => window.location.reload()} className="inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 [&_svg]:pointer-events-none">
        <RotateCw strokeWidth={1} />
      </button>
    </Tooltip>
  );
}
