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
          <DialogDescription>1. 여러 날짜에 걸친 일정이 보이도록 추가되었습니다.</DialogDescription>
          <DialogDescription>2. 한 셀에 몇개의 일정을 보이게 할지 설정할 수 있도록 개선되었습니다.</DialogDescription>
          <DialogDescription>3. 자정이 넘어가면 하루가 바뀌지 않는 오류가 수정되었습니다.</DialogDescription>
          <DialogDescription>4. 실행 시 오류 화면이 등장하는 문제를 해결했습니다.</DialogDescription>
          <DialogDescription>5. 일정이 많아지면 어색하게 보이는 오류를 수정했습니다.</DialogDescription>
          <DialogDescription>6. 공휴일표시 기능을 꺼도 하단에 보이는 노출되는 문제가 수정되었습니다.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
