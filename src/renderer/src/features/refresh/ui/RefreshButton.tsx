import { trackEvent } from '@aptabase/electron/renderer'
import { RotateCw } from 'lucide-react'

export function RefreshButton() {
    return (
        <RotateCw
            strokeWidth={1.5}
            onClick={() => {
                window.location.reload()
                trackEvent('RefreshButton')
            }}
        />
    )
}
