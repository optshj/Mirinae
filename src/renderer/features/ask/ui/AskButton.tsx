import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { HangulTextArea } from '@/shared/ui/textarea';

const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

export function AskButton({ closeDropDown }: { closeDropDown?: () => void }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    setIsSending(true);

    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🚀 새로운 사용자 문의',
              description: content,
              color: 5814783,
              fields: [{ name: '발신 시각', value: new Date().toLocaleString(), inline: true }]
            }
          ]
        })
      });

      if (response.ok) {
        toast.success('문의가 전송되었습니다', { description: '소중한 의견 감사합니다!' });
        setContent('');
        setOpen(false);
      } else {
        toast.error('문의 전송에 실패했습니다', { description: '잠시 후 다시 시도해주세요' });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div onClick={closeDropDown}>문의하기</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>문의하기</DialogTitle>
          <DialogDescription>발견한 버그나 개선사항을 알려주세요!</DialogDescription>
          <DialogDescription>문의 내용은 단순 텍스트로, 개인정보는 수집되지 않습니다.</DialogDescription>
        </DialogHeader>
        <HangulTextArea
          className="min-h-[200px] rounded-md border p-3 text-sm dark:border-zinc-700"
          autoFocus
          placeholder="문의 내용을 입력하세요..."
          value={content}
          onChange={setContent}
          disabled={isSending}
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-100" disabled={isSending}>
            취소
          </button>
          <button onClick={handleSubmit} className="bg-main-color rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={isSending || !content.trim()}>
            {isSending ? '전송 중...' : '문의 보내기'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
