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
          <DialogDescription>1. 캘린더 성능이 최적화 되었습니다.</DialogDescription>
          <DialogDescription>1. 일부 오류가 수정되었습니다.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
