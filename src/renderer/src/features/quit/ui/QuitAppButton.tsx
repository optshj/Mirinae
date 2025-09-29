import { trackEvent } from '@aptabase/electron/renderer'

export function QuitAppButton() {
    return (
        <div
            onClick={() => {
                window.api.quitApp()
                trackEvent('QuitAppButton')
            }}
            className="text-red-500 dark:text-red-400"
        >
            앱 종료
        </div>
    )
}
