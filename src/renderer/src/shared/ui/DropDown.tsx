import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DropDownProps {
    trigger: React.ReactNode
    children: React.ReactNode
    align?: 'left' | 'right'
}

/**
 * 트리거 요소에 연결된 드롭다운 메뉴를 렌더링한다.
 *
 * @param trigger - 드롭다운을 여닫는 트리거로 렌더링할 React 노드
 * @param children - 드롭다운 메뉴 내부에 렌더링할 내용
 * @param align - 메뉴의 수평 정렬을 지정합니다. 'left' 또는 'right'을 사용하며 기본값은 'left'입니다.
 * @returns 드롭다운 트리거와 메뉴를 포함하는 React 요소
 */
export default function DropDown({ trigger, children, align = 'left' }: DropDownProps) {
    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target
            if (!(target instanceof Node)) return

            const menu = menuRef.current
            const trigger = triggerRef.current

            if (menu?.contains(target) || trigger?.contains(target)) return
            setOpen(false)
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setPosition({
                top: rect.bottom + window.scrollY,
                left: align === 'right' ? rect.right + window.scrollX - 160 : rect.left + window.scrollX,
                width: rect.width
            })
        }
    }, [open, align])

    return (
        <>
            <div role="button" ref={triggerRef} onClick={() => setOpen((v) => !v)}>
                {trigger}
            </div>

            {createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: 'absolute',
                        top: position.top,
                        left: position.left,
                        minWidth: '160px'
                    }}
                    className={`bg-primary z-[9999] mt-2 flex flex-col gap-2 rounded-xl px-4 py-2 shadow-lg transition-all duration-200 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} `}
                >
                    {children}
                </div>,
                document.body
            )}
        </>
    )
}
