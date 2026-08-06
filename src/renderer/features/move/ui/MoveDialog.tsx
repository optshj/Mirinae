import { Button } from '@/shared/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';

import { useMove } from '../model/move-context';

// 드롭다운 바깥에서 렌더되어, 드롭다운이 닫혀도 안내창과 '적용' 버튼이 유지된다.
// 캘린더를 가리지 않도록 상단에 토스트(sonner)와 같은 형태로 띄운다: 아이콘 | 타이틀·설명 | 적용.
// 조절 가능한 창 경계는 액센트 점선 아웃라인이 표시한다 (pages/Calender의 html.resizable 아웃라인, 미니뷰에선 크기 조절이 불가해 표시하지 않는다).
export function MoveDialog() {
  const { isDrag, canResize, container, stop } = useMove();

  return (
    <Dialog open={isDrag} onOpenChange={(open) => !open && stop()}>
      <DialogContent
        container={container}
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        overlayClassName="absolute bg-black/10 rounded-lg"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        className="data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 border-primary absolute top-21 bottom-auto flex w-auto max-w-none translate-y-0 items-center gap-3 rounded-full border py-2 pr-4 pl-6 shadow-[0_14px_44px_rgba(0,0,0,0.35)] sm:max-w-none"
      >
        <div className="flex flex-col">
          <DialogTitle className="text-[15px] font-semibold whitespace-nowrap">캘린더를 드래그해 옮겨보세요</DialogTitle>
          <DialogDescription className="text-secondary text-[12px] whitespace-nowrap">
            {canResize ? '점선을 끌면 크기도 조절할 수 있어요' : '미니뷰에서는 위치만 옮길 수 있어요'}
          </DialogDescription>
        </div>
        <DialogClose asChild>
          <Button
            type="button"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className="dark:text-font-black bg-main-color hover:bg-main-color pointer-events-auto! h-auto rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:scale-105 hover:brightness-105"
          >
            완료
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
