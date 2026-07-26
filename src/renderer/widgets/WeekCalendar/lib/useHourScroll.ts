import { useEffect, useRef, useState } from 'react';

const STEP_HOURS = 3;

// electron-as-wallpaper로 창을 데스크톱 배경에 붙이면 마우스 휠은 전달되지 않고,
// 누른 채로 움직이는 드래그 제스처도 중간에 disable-click 폴링 등에 끊길 수 있어 신뢰할 수 없다.
// 그래서 버튼 클릭(단일 클릭)만으로 시간대를 이동하는 방식을 쓴다.
export function useHourScroll(contentHeight: number, hourHeightPx: number, initialOffset: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const maxOffset = Math.max(0, contentHeight - viewportHeight);

  const [offset, setOffsetState] = useState(initialOffset);
  const offsetRef = useRef(offset);

  const setOffset = (value: number) => {
    const clamped = Math.min(maxOffset, Math.max(0, value));
    offsetRef.current = clamped;
    setOffsetState(clamped);
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewportHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setOffset(offsetRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportHeight, contentHeight]);

  const stepUp = () => setOffset(offsetRef.current - STEP_HOURS * hourHeightPx);
  const stepDown = () => setOffset(offsetRef.current + STEP_HOURS * hourHeightPx);

  // 일부 환경에서는 휠 이벤트가 정상적으로 전달될 수 있으므로 보조 수단으로 함께 지원
  const handleWheel = (e: React.WheelEvent) => setOffset(offsetRef.current + e.deltaY);

  return { viewportRef, offset, maxOffset, stepUp, stepDown, handleWheel };
}
