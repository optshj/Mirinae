import { useDeleteEvent } from '@/entities/event';
import { posthog } from '@/shared/lib/posthog';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { CalendarEvent } from '@/shared/types/EventType';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';

export function DeleteEventButton({ event }: { event: CalendarEvent }) {
  const { deleteEvent } = useDeleteEvent();
  const isRecurring = event.recurringEventId !== undefined;

  if (!isRecurring) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteEvent({ eventId: event.id });
          posthog.capture('delete_event');
          toast.error('일정이 삭제되었습니다.');
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
          <DropdownMenuItem
            onClick={() => {
              deleteEvent({ eventId: event.id });
              posthog.capture('delete_event');
              toast.error('일정이 삭제되었습니다.');
            }}
          >
            이 일정만 삭제
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              deleteEvent({ eventId: event.id, recurringEventId: event.recurringEventId });
              posthog.capture('delete_event');
              toast.error('모든 반복 일정이 삭제되었습니다.');
            }}
          >
            모든 반복 일정 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
