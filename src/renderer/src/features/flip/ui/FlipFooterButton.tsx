import { useState } from 'react';

export function FlipFooterButton() {
    const [isFlip, setIsFlip] = useState(false);
    const onClick = () => {
        setIsFlip((prev) => !prev);
        document.documentElement.classList.toggle('flip-footer');
    };

    return (
        <div className="flex flex-row justify-between">
            <label>달력만보기</label>
            <button
                type="button"
                onClick={onClick}
                onKeyDown={(e) => e.preventDefault()}
                className={`border-background-secondary relative flex h-6 w-12 items-center justify-center rounded-full transition-colors duration-300 ${isFlip ? 'bg-green-500' : 'bg-zinc-400'}`}
            >
                <div className={`absolute h-5 w-5 rounded-full bg-white p-1 transition-all duration-300 ${isFlip ? 'translate-x-3' : '-translate-x-3'} `} />
            </button>
        </div>
    );
}
