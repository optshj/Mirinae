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
          <DialogDescription>1. 듀얼모니터에서 어색한 위치로 이동하는 오류가 수정되었습니다.</DialogDescription>
          <DialogDescription>2. 날짜 클릭 시 D-Day가 표시됩니다.</DialogDescription>
          <DialogDescription>3. 일정 추가 폼 디자인이 수정되었습니다.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
