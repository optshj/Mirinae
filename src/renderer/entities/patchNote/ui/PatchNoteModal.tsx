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
          <DialogDescription>1. 특정 상황에서 일정 추가,수정,삭제가 잘 안되는 오류를 수정하였습니다.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
