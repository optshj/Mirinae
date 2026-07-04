import { createPortal } from 'react-dom';
import { EventList, EventSegment } from '@/entities/event';

interface DragGhostProps {
  seg: EventSegment;
  ghost: { width: number; height: number; offsetX: number; offsetY: number };
  ghostRef: React.RefObject<HTMLDivElement | null>;
  posRef: React.RefObject<{ x: number; y: number }>;
}
export function DragGhost({ seg, ghost, ghostRef, posRef }: DragGhostProps) {
  return createPortal(
    <div
      ref={ghostRef}
      className="pointer-events-none fixed z-50"
      style={{
        width: ghost.width,
        height: ghost.height,
        left: posRef.current.x - ghost.offsetX,
        top: posRef.current.y - ghost.offsetY
      }}
    >
      <EventList seg={seg} weekStart={seg.start} onDoubleClick={() => {}} interactive={false} />
    </div>,
    document.body
  );
}
