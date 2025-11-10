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
                    <DialogDescription>1. 앱 용량이 매우 작아졌습니다.</DialogDescription>
                    <DialogDescription>2. 의도치 않은 클릭이 발생하지 않게 수정하였습니다.</DialogDescription>
                    <DialogDescription>3. 중요한 일정의 색상을 지정할 수 있는 버튼이 생겼습니다.</DialogDescription>
                    <DialogDescription>4. 일부 기능을 키보드로 사용하실 수 있습니다.</DialogDescription>
                    <DialogDescription>5. 주말에 색상이 들어갔습니다.</DialogDescription>
                    <DialogDescription>6. 기타 버그 수정 및 성능 개선이 이루어졌습니다.</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
