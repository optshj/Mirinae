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
                    <DialogDescription>1. 일부 일정의 색이 지정되지 않는 오류를 수정했습니다.</DialogDescription>
                    <DialogDescription>2. 캘린더가 안 접히던 오류를 수정했습니다.</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
