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
          <DialogDescription>1. 날짜를 더블클릭해야 열리도록 변경했습니다.</DialogDescription>
          <DialogDescription>2. 상단 메시지 UI가 개선되었습니다.</DialogDescription>
          <DialogDescription>3. 클릭이 어색한 오류가 수정되었습니다.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
