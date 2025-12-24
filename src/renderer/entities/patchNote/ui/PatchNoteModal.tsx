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
            <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>새롭게 변경된 기능</DialogTitle>
                    <DialogDescription>1. 일정 글자가 조금 작아졌습니다.</DialogDescription>
                    <DialogDescription>2. 일정 추가/수정 시 간편하게 입력할 수 있도록 개선되었습니다.</DialogDescription>
                    <DialogDescription>3. 일정을 완료 표시할 수 있도록 기능이 추가되었습니다.</DialogDescription>
                    <DialogDescription>4. 개발자에게 문의하기 기능이 추가되었습니다. 자유롭게 문의하세요!</DialogDescription>
                    <DialogDescription>5. 기타 여러 버그가 수정되고 성능이 향상되었습니다.</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
