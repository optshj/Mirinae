import { ChevronDown, ChevronUp } from 'lucide-react';
import { setFlipFooter } from '../lib/flipFooter';

export function FooterToggleTab() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-48 z-10 flex translate-y-1/2 justify-center transition-all duration-300 ease-in-out [html.flip-footer_&]:bottom-0 [html.flip-footer_&]:translate-y-0 [html.resizable_&]:transition-none">
      <button
        type="button"
        tabIndex={-1}
        data-hoverable
        onClick={() => setFlipFooter(!document.documentElement.classList.contains('flip-footer'), 'footer_tab')}
        className="bg-surface border-surface text-secondary data-hovered:text-primary pointer-events-auto flex h-5 items-center gap-0.5 rounded-full border px-2.5 text-[11px] font-medium transition-[border-radius,border-width] duration-300 ease-in-out [html.flip-footer_&]:rounded-t-md [html.flip-footer_&]:rounded-b-none [html.flip-footer_&]:border-b-0"
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
    </div>
  );
}
