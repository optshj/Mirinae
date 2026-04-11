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
          <DialogTitle>업데이트 내용</DialogTitle>
          <DialogDescription>1. 캘린더 폰트가 제대로 적용되지 않는 오류를 수정했습니다.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
