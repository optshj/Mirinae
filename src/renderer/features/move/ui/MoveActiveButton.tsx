import { useMove } from '../model/move-context';

interface MoveActiveButtonProps {
  onStart?: () => void;
}

export function MoveActiveButton({ onStart }: MoveActiveButtonProps) {
  const { isDrag, start, stop } = useMove();

  const handleClick = () => {
    if (isDrag) {
      stop();
    } else {
      start();
      onStart?.();
    }
  };

  return (
    <div onClick={handleClick} className="flex flex-col gap-0.5">
      <span>{isDrag ? '화면조절 종료' : '화면조절 시작'}</span>
      <span className="text-secondary text-[11px]">{isDrag ? '조절을 마쳤으면 눌러서 종료해요' : '드래그로 위치와 크기를 바꿔요'}</span>
    </div>
  );
}
