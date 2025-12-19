import { Switch } from '@/shared/ui/switch';
import { useEffect, useState } from 'react';

export function FlipFooterButton() {
    const [isFlip, setIsFlip] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('flipFooter');
        if (saved === 'true') {
            setIsFlip(true);
            document.documentElement.classList.add('flip-footer');
        }
    }, []);

    const onClick = () => {
        setIsFlip((prev) => {
            const next = !prev;
            document.documentElement.classList.toggle('flip-footer', next);
            localStorage.setItem('flipFooter', next.toString());
            return next;
        });
    };

    return (
        <div className="flex flex-row justify-between">
            <label>달력만보기</label>
            <Switch onClick={onClick} isOn={isFlip} />
        </div>
    );
}
