import { useState } from 'react';
import { FoldVertical, UnfoldVertical } from 'lucide-react';
import { trackEvent } from '@aptabase/electron/renderer';

export function FlipCalendarButton() {
    const [isFlip, setIsFlip] = useState(false);

    const handleClick = () => {
        document.documentElement.classList.toggle('flip-calendar');
        setIsFlip((prev) => !prev);
        trackEvent('FlipButton');
    };
    return <>{isFlip ? <UnfoldVertical strokeWidth={1.0} role="button" size={24} onClick={handleClick} /> : <FoldVertical strokeWidth={1.0} role="button" size={24} onClick={handleClick} />}</>;
}
