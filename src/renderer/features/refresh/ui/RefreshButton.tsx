import { RotateCw } from 'lucide-react';
import { Tooltip } from '@/shared/ui/tooltip';

export function RefreshButton() {
    return (
        <Tooltip content="새로고침" side="bottom">
            <RotateCw strokeWidth={1} onClick={() => window.location.reload()} />
        </Tooltip>
    );
}
