import { useState } from 'react'

export function MoveActiveButton() {
    const [isDrag, setIsDrag] = useState(false)
    return (
        <>
            {isDrag ? (
                <div
                    onClick={() => {
                        setIsDrag(false)
                        window.api.stopDragging()
                    }}
                >
                    위치수정 종료
                </div>
            ) : (
                <div
                    onClick={() => {
                        setIsDrag(true)
                        window.api.startDragging()
                    }}
                >
                    위치수정 시작
                </div>
            )}
        </>
    )
}
