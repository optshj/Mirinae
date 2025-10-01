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
                    <DialogDescription>2. 일정 추가/수정 폼의 디자인이 변경되었어요</DialogDescription>
                    <DialogDescription>3. 일정 추가/수정 시 **하루종일** 옵션을 선택할 수 있습니다 </DialogDescription>
                    <DialogDescription>4. 기타 버그 수정 및 성능 개선되었어요</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
