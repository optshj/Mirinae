import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

export function PatchNoteModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const cleanup = window.api.onShowPatchNotes(() => {
            setIsOpen(true);
        });
        return cleanup;
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>새롭게 변경된 기능</DialogTitle>
                    <DialogDescription>1. 하단 일정 패널이 접히도록 개선되어 달력을 더 넓게 볼 수 있습니다.</DialogDescription>
                    <DialogDescription>2. 일부 부자연스러운 UI 요소가 개선되었습니다.</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
