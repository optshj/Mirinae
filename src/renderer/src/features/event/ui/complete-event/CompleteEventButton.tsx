import { Check } from 'lucide-react';
import { useCompleteEvent } from './CompleteEventButton.mutation';
import { toast } from 'sonner';

interface CompleteEventButtonProps {
    eventId: string;
    isCompleted: string;
}
export function CompleteEventButton({ eventId, isCompleted }: CompleteEventButtonProps) {
    const { completeEvent } = useCompleteEvent();

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toast.info(isCompleted ? '일정이 미완료로 표시되었습니다.' : '일정이 완료로 표시되었습니다.');
        completeEvent({
            eventId,
            isCompleted: isCompleted ? '' : 'true'
        });
    };

    return (
        <button onClick={handleToggle} tabIndex={-1}>
            <Check strokeWidth={1.5} size={16} />
        </button>
    );
}
