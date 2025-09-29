import { useState, useEffect } from 'react'
import { trackEvent } from '@aptabase/electron/renderer'
import { MdDarkMode, MdLightMode } from 'react-icons/md'

export function DarkModeButton() {
    const [darkMode, setDarkMode] = useState(() => {
        const storedTheme = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        return storedTheme === 'dark' || (!storedTheme && prefersDark)
    })

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    const toggleDarkMode = () => {
        setDarkMode((prev) => {
            const newDark = !prev
            localStorage.setItem('theme', newDark ? 'dark' : 'light')
            trackEvent('ChangeDarkMode')
            return newDark
        })
    }

    return (
        <div className="flex flex-row justify-between">
            <label>다크모드</label>
            <button
                onClick={toggleDarkMode}
                onKeyDown={(e) => e.preventDefault()}
                className="relative flex h-6 w-12 items-center justify-center rounded-full bg-yellow-400 transition-colors duration-300 dark:bg-gray-500"
            >
                <div className={`absolute h-5 w-5 rounded-full bg-white p-1 transition-transform duration-300 ${darkMode ? '-translate-x-3' : 'translate-x-3'}`}>
                    {darkMode ? <MdDarkMode className="h-full w-full text-gray-500" /> : <MdLightMode className="h-full w-full text-yellow-400" />}
                </div>
            </button>
        </div>
    )
}
