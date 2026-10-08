import { RefObject, useSyncExternalStore } from 'react';

// 스타일만 필요하면: <div data-hoverable className="data-hovered:bg-..." />
// React로 그려야 하면 (툴팁, 팝오버): useHover(ref)
let hovered: HTMLElement[] = [];
const listeners = new Set<() => void>();

function update(next: HTMLElement[]) {
  if (next.length === hovered.length && next.every((el, i) => el === hovered[i])) return;
  hovered.forEach((el) => !next.includes(el) && el.removeAttribute('data-hovered'));
  next.forEach((el) => el.setAttribute('data-hovered', ''));
  hovered = next;
  listeners.forEach((listener) => listener());
}

const onMove = (e: PointerEvent) => update(document.elementsFromPoint(e.clientX, e.clientY).filter((el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('data-hoverable')));
const clear = () => update([]);

/** 앱 시작 시 main.tsx에서 한 번만 호출. 앱이 꺼질 때까지 유지되므로 정리하지 않는다. */
export function startHoverTracking() {
  window.addEventListener('pointermove', onMove);
  window.addEventListener('blur', clear);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** ref 요소(자신 포함) 안에서 커서 아래에 있는 가장 안쪽 [data-hoverable] 요소. 바뀔 때만 리렌더된다. */
export function useHover(ref: RefObject<HTMLElement | null>) {
  return useSyncExternalStore(subscribe, () => {
    const root = ref.current;
    return root ? (hovered.find((el) => root.contains(el)) ?? null) : null;
  });
}
