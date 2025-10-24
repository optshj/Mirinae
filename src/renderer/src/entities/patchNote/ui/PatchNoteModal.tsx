import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useEffect, useState } from 'react'

export function PatchNoteModal() {
    const [isOpen, setIsOpen] = useState(false)
    useEffect(() => {
        const cleanup = window.api.onShowPatchNotes(() => {
            setIsOpen(true)
        })
        return cleanup
    }, [])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>새롭게 변경된 기능</DialogTitle>
                    <DialogDescription>1. 화면 조절 시 보이던 아래 여백을 없앴어요</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
