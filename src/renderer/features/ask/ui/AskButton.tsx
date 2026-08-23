import { MoveUpRight } from 'lucide-react';
import { SITE_URL } from '@/shared/const/site';

export function AskButton() {
  return (
    <div className="flex flex-row items-center justify-between" onClick={() => window.api.openExternal(`${SITE_URL}/bug-report`)}>
      문의하기
      <MoveUpRight size={14} strokeWidth={1.5} className="text-secondary" />
    </div>
  );
}
