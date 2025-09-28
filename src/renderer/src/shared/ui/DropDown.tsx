import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DropDownProps {
    trigger: React.ReactNode
    children: React.ReactNode
    align?: 'left' | 'right'
}

export default function DropDown({ trigger, children, align = 'left' }: DropDownProps) {
    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

    const triggerRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (open && triggerRef.current) {
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
            <div role="button" ref={triggerRef} onClick={() => setOpen((v) => !v)} className="inline-block">
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
                    className={`bg-primary z-[9999] mt-2 flex origin-top flex-col gap-2 rounded-xl px-4 py-2 shadow-lg transition-all duration-200 ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'} `}
                >
                    {children}
                </div>,
                document.body
            )}
        </>
    )
}
