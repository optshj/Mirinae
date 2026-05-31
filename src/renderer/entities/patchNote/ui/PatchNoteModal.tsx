import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

export function PatchNoteModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const cleanup = window.api.onShowPatchNotes(() => setIsOpen(true));
    return cleanup;
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex flex-row items-baseline gap-3">
            <span className="text-foreground text-2xl font-bold tracking-tight">업데이트 내용</span>
          </DialogTitle>
          <DialogDescription>1. 간혹 일정 추가/수정/삭제가 안되는 오류가 수정되었습니다.</DialogDescription>
          <DialogDescription>2. 반복 일정이 정상적으로 표시됩니다.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
