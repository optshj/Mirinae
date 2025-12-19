import { useState } from 'react';
import { MoveIcon } from 'lucide-react';

import { trackEvent } from '@aptabase/electron/renderer';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';

export function MoveActiveButton({ closeDropDown, closeOnClick = true }: { closeDropDown?: () => void; closeOnClick?: boolean }) {
    const [isDrag, setIsDrag] = useState(false);
    const toggleDrag = () => {
        if (closeOnClick && closeDropDown) {
            closeDropDown();
        }
        setIsDrag((prev) => !prev);
        if (isDrag) {
            window.api.stopDragging();
            document.documentElement.classList.remove('resizable');
        } else {
            window.api.startDragging();
            document.documentElement.classList.add('resizable');
            trackEvent('MoveActiveButton');
        }
    };

    return (
        <Dialog open={isDrag} onOpenChange={toggleDrag}>
            <DialogTrigger asChild>
                <div>{isDrag ? '화면조절 종료' : '화면조절 시작'}</div>
            </DialogTrigger>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MoveIcon size={16} aria-hidden="true" />
                        화면조절 중
                    </DialogTitle>
                    <DialogDescription>캘린더를 드래그하여 위치를 조절하세요.</DialogDescription>
                    <DialogDescription>창의 테두리를 드래그하여 크기를 조절할 수 있습니다.</DialogDescription>
                    <DialogDescription>조절을 마치려면 아래 &apos;적용&apos; 버튼을 클릭하세요.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button">적용</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
