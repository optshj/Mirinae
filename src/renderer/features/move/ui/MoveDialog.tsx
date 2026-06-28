import { MoveIcon } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

import { useMove } from '../model/move-context';

// 드롭다운 바깥에서 렌더되어, 드롭다운이 닫혀도 안내창과 '적용' 버튼이 유지된다.
export function MoveDialog() {
  const { isDrag, stop } = useMove();

  return (
    <Dialog open={isDrag} onOpenChange={(open) => !open && stop()}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveIcon size={16} aria-hidden="true" />
            화면조절 중
          </DialogTitle>
          <DialogDescription>캘린더를 드래그하여 위치를 조절하세요.</DialogDescription>
          <DialogDescription>창의 테두리를 드래그하여 크기를 조절할 수 있습니다.</DialogDescription>
          <DialogDescription>조절을 마치려면 아래 &apos;적용&apos; 버튼을 클릭하세요.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="pointer-events-auto!" type="button">
              적용
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
