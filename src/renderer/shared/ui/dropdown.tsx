import React, { useCallback, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropDownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
    closeOnClick?: boolean;
}
export function DropDown({ trigger, children, align = 'left', closeOnClick = true }: DropDownProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const closeDropDownForChild = useCallback(() => setOpen(false), []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }

            const dropdown = dropdownRef.current;
            const trigger = triggerRef.current;

            if (dropdown?.contains(target) || trigger?.contains(target)) {
                return;
            }
            setOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!triggerRef.current) {
            return;
        }
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
            top: rect.bottom + window.scrollY,
            left: align === 'right' ? rect.right + window.scrollX - 160 : rect.left + window.scrollX
        });
    }, [open, align]);

    const handleDropDownClick = () => {
        if (closeOnClick) {
            setOpen(false);
        }
    };

    return (
        <>
            <div role="button" ref={triggerRef} onClick={() => setOpen((v) => !v)}>
                {trigger}
            </div>

            {createPortal(
                <div
                    ref={dropdownRef}
                    onClick={handleDropDownClick}
                    style={{
                        top: position.top,
                        left: position.left
                    }}
                    className={`bg-primary absolute z-9999 mt-2 flex min-w-40 flex-col gap-2 rounded-xl px-3 py-3 shadow-lg transition-all duration-200 ${
                        open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                    }`}
                >
                    {React.Children.map(children, (child) => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child as React.ReactElement<{ closeDropDown: () => void }>, {
                                closeDropDown: closeDropDownForChild
                            });
                        }
                        return child;
                    })}
                </div>,
                document.body
            )}
        </>
    );
}
