import { IoCloseOutline } from 'react-icons/io5'
import { useDeleteEvent } from './DeleteEventButton.mutation'
import { toast } from 'sonner'
import { trackEvent } from '@aptabase/electron/renderer'

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
            <IoCloseOutline />
        </button>
    )
}
