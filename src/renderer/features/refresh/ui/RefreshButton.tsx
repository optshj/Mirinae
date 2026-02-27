import { RotateCw } from 'lucide-react';

export function RefreshButton() {
    return <RotateCw strokeWidth={1} onClick={() => window.location.reload()} />;
}
