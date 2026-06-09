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
          <DialogDescription>1. 달력만 보기 기능이 제대로 작동하지 않던 오류를 수정했습니다</DialogDescription>
          <DialogDescription>2. 일정을 완료 표시 할 때, 반영이 느리던 문제를 수정했습니다</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
