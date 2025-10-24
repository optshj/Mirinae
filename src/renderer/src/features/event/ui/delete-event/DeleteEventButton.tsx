import { useDeleteEvent } from './DeleteEventButton.mutation'
import { toast } from 'sonner'
import { trackEvent } from '@aptabase/electron/renderer'
import { X } from 'lucide-react'

export function DeleteEventButton({ eventId }: { eventId: string }) {
    const { deleteEvent } = useDeleteEvent()

    return (
        <button
            onDoubleClick={(e) => {
                e.stopPropagation()
                deleteEvent(eventId)
                trackEvent('DeleteEvent')
                toast.success('일정이 삭제되었습니다.')
            }}
        >
            <X strokeWidth={1.5} size={16} />
        </button>
    )
}
