export function QuitAppButton() {
    return (
        <div onClick={() => window.api.quitApp()} className="text-red-500 dark:text-red-400">
            앱 종료
        </div>
    );
}
