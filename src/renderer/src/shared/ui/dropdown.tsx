import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropDownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
    closeOnClick?: boolean;
}

/**
 * 트리거 요소에 연결된 드롭다운 메뉴를 렌더링한다.
 *
 * @param trigger - 드롭다운을 여닫는 트리거
 * @param children - 드롭다운 내부 콘텐츠
 * @param align - 메뉴 정렬 방향 ('left' | 'right')
 * @param closeOnClick - 내부 클릭 시 닫을지 여부
 */
export default function DropDown({ trigger, children, align = 'left', closeOnClick = true }: DropDownProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target;
            if (!(target instanceof Node)) return;

            const menu = menuRef.current;
            const trigger = triggerRef.current;

            if (menu?.contains(target) || trigger?.contains(target)) return;
            setOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
            top: rect.bottom + window.scrollY,
            left: align === 'right' ? rect.right + window.scrollX - 160 : rect.left + window.scrollX,
            width: rect.width
        });
    }, [open, align]);

    const handleMenuClick = () => {
        if (closeOnClick) setOpen(false);
    };

    return (
        <>
            <div role="button" ref={triggerRef} onClick={() => setOpen((v) => !v)}>
                {trigger}
            </div>

            {createPortal(
                <div
                    ref={menuRef}
                    onClick={handleMenuClick}
                    style={{
                        top: position.top,
                        left: position.left
                    }}
                    className={`bg-primary absolute z-[9999] mt-2 flex flex-col gap-2 rounded-xl px-3 py-3 shadow-lg transition-all duration-200 ${
                        open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                    }`}
                >
                    {children}
                </div>,
                document.body
            )}
        </>
    );
}
