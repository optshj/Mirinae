import { ChevronDown, ChevronUp } from 'lucide-react';
import { setFlipFooter } from '../lib/flipFooter';

// 펼침: 달력과 푸터 경계선(푸터 h-44) 가운데에 걸침 / 접힘: 창 아래 가장자리로 내려옴.
// 라벨은 html.flip-footer 클래스로만 바꿔서 설정 메뉴에서 바꿔도 따로 동기화할 필요가 없다.
export function FooterToggleTab() {
  return (
    <button
      type="button"
      tabIndex={-1}
      data-hoverable
      onClick={() => setFlipFooter(!document.documentElement.classList.contains('flip-footer'), 'footer_tab')}
      className="bg-primary border-primary text-secondary data-hovered:text-primary absolute bottom-44 left-1/2 z-10 flex h-5 -translate-x-1/2 translate-y-1/2 items-center gap-0.5 rounded-full border px-2.5 text-[11px] font-medium shadow-sm transition-all duration-300 ease-in-out [html.flip-footer_&]:bottom-0 [html.flip-footer_&]:translate-y-0 [html.flip-footer_&]:rounded-t-md [html.flip-footer_&]:rounded-b-none [html.flip-footer_&]:border-b-0 [html.resizable_&]:transition-none"
    >
      <span className="contents [html.flip-footer_&]:hidden">
        <ChevronDown size={12} className="pointer-events-none" />
        접기
      </span>
      <span className="hidden [html.flip-footer_&]:contents">
        <ChevronUp size={12} className="pointer-events-none" />
        펼치기
      </span>
    </button>
  );
}
