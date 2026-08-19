import { MoveUpRight } from 'lucide-react';

export function GuideButton() {
  return (
    <div className="flex flex-row items-center justify-between" onClick={() => window.api.openExternal('https://www.mirinaecalendar.store/docs')}>
      기능소개
      <MoveUpRight size={14} strokeWidth={1.5} className="text-secondary" />
    </div>
  );
}
