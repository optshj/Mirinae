import { useDeleteEvent, useRestoreEvent } from '@/entities/event';
import { X } from 'lucide-react';
import { CalendarEvent } from '@/shared/types/EventType';
import { posthog } from '@/shared/lib/posthog';
import { showUndoToast } from '@/shared/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';

export function DeleteEventButton({ event }: { event: CalendarEvent }) {
  const { deleteEventAsync } = useDeleteEvent();
  const { restoreEvent } = useRestoreEvent();
  const isRecurring = event.recurringEventId !== undefined;

  // 되돌리기는 DELETE가 서버에 반영된 뒤 복원해야 하므로 promise에 체이닝 (실패 롤백은 훅에서 처리)
  const handleDelete = (message: string, params: { eventId: string; recurringEventId?: string }) => {
    const deleted = deleteEventAsync(params);
    deleted.catch(() => {});
    posthog.capture('delete_event');
    showUndoToast('error', message, () => {
      deleted
        .then(() =>
          restoreEvent({
            eventId: params.recurringEventId ?? params.eventId,
            // 반복 일정 전체 복원은 인스턴스 목록을 몰라 refetch에 맡기고, 단일/인스턴스는 낙관적으로 되살림
            event: params.recurringEventId ? undefined : event
          })
        )
        .catch(() => {});
      posthog.capture('delete_event_undo');
    });
  };

  if (!isRecurring) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete('일정을 삭제했어요', { eventId: event.id });
        }}
        tabIndex={-1}
      >
        <X strokeWidth={1.5} size={16} />
      </button>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <X strokeWidth={1.5} size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleDelete('일정을 삭제했어요', { eventId: event.id })}>이 일정만 삭제</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => handleDelete('반복 일정을 모두 삭제했어요', { eventId: event.id, recurringEventId: event.recurringEventId })}>
            모든 반복 일정 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
