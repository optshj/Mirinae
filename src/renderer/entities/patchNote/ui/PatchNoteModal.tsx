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
          <DialogDescription>1. 반복일정을 설정할 수 있도록 추가되었습니다.</DialogDescription>
          <DialogDescription>2. 일정을 색상별로 필터링하여 볼 수 있습니다.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
