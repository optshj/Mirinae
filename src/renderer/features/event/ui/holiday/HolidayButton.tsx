import { useEffect, useState } from 'react';
import { Switch } from '@/shared/ui/switch';

export function HolidayButton() {
    const [isShow, setIsShow] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('holiday');
        if (saved === 'true' || saved === null) {
            setIsShow(true);
            document.documentElement.classList.add('show-holiday');
        }
    }, []);

    const onClick = () => {
        setIsShow((prev) => {
            const next = !prev;
            document.documentElement.classList.toggle('show-holiday', next);
            localStorage.setItem('holiday', next.toString());
            return next;
        });
    };
    return (
        <div className="flex flex-row justify-between">
            <label>공휴일표시</label>
            <Switch onClick={onClick} isOn={isShow} />
        </div>
    );
}
