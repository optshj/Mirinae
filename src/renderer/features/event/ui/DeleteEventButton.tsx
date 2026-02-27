import { useDeleteEvent } from '@/entities/event';
import { trackEvent } from '@aptabase/electron/renderer';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useLogin } from '@/shared/hooks/useLogin';

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const { tokens } = useLogin();
  const { deleteEvent } = useDeleteEvent();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        deleteEvent({ eventId, accessToken: tokens.access_token });
        trackEvent('DeleteEvent');
        toast.success('일정이 삭제되었습니다.');
      }}
      tabIndex={-1}
    >
      <X strokeWidth={1.5} size={16} />
    </button>
  );
}
