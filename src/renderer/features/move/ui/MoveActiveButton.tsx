import { useMove } from '../model/move-context';

interface MoveActiveButtonProps {
  // 화면조절을 시작할 때 부모(드롭다운)를 닫기 위한 콜백
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

  return <div onClick={handleClick}>{isDrag ? '화면조절 종료' : '화면조절 시작'}</div>;
}
