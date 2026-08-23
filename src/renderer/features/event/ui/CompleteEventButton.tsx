import { Check } from 'lucide-react';
import { useCompleteEvent } from '@/entities/event';
import { CalendarEvent } from '@/shared/types/EventType';
import { posthog } from '@/shared/lib/posthog';
import { showUndoToast } from '@/shared/ui/sonner';
import { Tooltip } from '@/shared/ui/tooltip';

export function CompleteEventButton({ event }: { event: CalendarEvent }) {
  const { completeEvent } = useCompleteEvent();
  const completed = event.extendedProperties?.private?.completed === 'true';

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCompleted = !completed;
    completeEvent({ eventId: event.id, completed: nextCompleted });
    posthog.capture(nextCompleted ? 'complete_event' : 'uncomplete_event');
    showUndoToast('success', nextCompleted ? '일정을 완료했어요' : '미완료로 표시했어요', () => {
      completeEvent({ eventId: event.id, completed });
      posthog.capture(nextCompleted ? 'complete_event_undo' : 'uncomplete_event_undo');
    });
  };

  return (
    <Tooltip content={completed ? '미완료로 표시하기' : '일정 완료하기'}>
      <button onClick={handleToggleComplete} tabIndex={-1} className={`flex h-8 w-8 items-center justify-center ${completed ? 'opacity-50' : ''}`}>
        <Check strokeWidth={1.5} size={18} />
      </button>
    </Tooltip>
  );
}
