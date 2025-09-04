import { RotateCw } from 'lucide-react'

export function RefreshButton() {
    return <RotateCw strokeWidth={1.5} onClick={() => window.location.reload()} className="text-primary" />
}
