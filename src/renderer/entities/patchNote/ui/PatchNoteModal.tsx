import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type PatchTag = '새 기능' | '개선' | '수정';

const PATCH_NOTES: { version: string; items: Array<{ tag: PatchTag; text: string }> } = {
  version: 'v0.4.3',
  items: [
    { tag: '개선', text: '더 많은 일정을 가져올 수 있게 바뀌었어요' },
    { tag: '개선', text: '화면조절 UI가 변경되었어요' }
  ]
};

const TAG_COLOR: Record<PatchTag, string> = {
  '새 기능': 'text-emerald-600 dark:text-emerald-400',
  개선: 'text-blue-600 dark:text-blue-400',
  수정: 'text-amber-600 dark:text-amber-400'
};

export function PatchNoteModal() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const cleanup = window.api.onShowPatchNotes(() => setIsOpen(true));
    return cleanup;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="bg-primary border-primary animate-in fade-in slide-in-from-bottom-2 fixed right-4 bottom-4 z-50 w-72 rounded-xl border p-4 shadow-[0_10px_40px_rgba(0,0,0,0.15)] duration-300">
      <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200" aria-label="닫기">
        <X size={15} />
      </button>
      <div className="text-primary mb-2 flex items-center gap-1.5 text-sm font-bold">
        새로워진 점 <span className="text-secondary text-xs font-medium tracking-wide">{PATCH_NOTES.version}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {PATCH_NOTES.items.map(({ tag, text }) => (
          <li key={text} className="flex items-start gap-1">
            <span className={`w-11 shrink-0 pt-px text-xs font-semibold ${TAG_COLOR[tag]}`}>{tag}</span>
            <span className="text-primary text-sm leading-relaxed">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
