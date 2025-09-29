import { useState } from 'react'
import { FoldVertical, UnfoldVertical } from 'lucide-react'
import { trackEvent } from '@aptabase/electron/renderer'

export function FlipButton() {
    const [isFlip, setIsFlip] = useState(false)

    const handleClick = () => {
        document.documentElement.classList.toggle('flip-calendar')
        setIsFlip((prev) => !prev)
        trackEvent('FlipButton')
    }
    // 플립애니메이션은 index.css에서 직접관리함 #calendar-container
    return <>{isFlip ? <UnfoldVertical strokeWidth={1.5} role="button" size={24} onClick={handleClick} /> : <FoldVertical strokeWidth={1.5} role="button" size={24} onClick={handleClick} />}</>
}
