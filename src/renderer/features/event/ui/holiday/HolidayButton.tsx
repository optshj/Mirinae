import { useEffect, useState } from 'react';
import { Switch } from '@/shared/ui/switch';

export function HolidayButton() {
    const [isShow, setIsShow] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('holiday');
            return saved === null ? true : saved === 'true';
        }
        return true;
    });

    useEffect(() => {
        document.documentElement.classList.toggle('show-holiday', isShow);
        localStorage.setItem('holiday', isShow.toString());
    }, [isShow]);

    const handleToggle = () => {
        setIsShow((prev) => !prev);
    };

    return (
        <div className="flex flex-row items-center justify-between gap-4">
            <label>공휴일 표시</label>
            <Switch onClick={handleToggle} isOn={isShow} />
        </div>
    );
}
