import { CircleHelp } from 'lucide-react';
import { SITE_URL } from '@/shared/const/site';
import { Tooltip } from '@/shared/ui/tooltip';
import { posthog } from '@/shared/lib/posthog';

export function GuideButton() {
  return (
    <Tooltip content="기능 소개" side="bottom">
      <div
        role="button"
        tabIndex={-1}
        onClick={() => {
          posthog.capture('guide_button');
          window.api.openExternal(`${SITE_URL}/docs`);
        }}
        className="inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 [&_svg]:pointer-events-none"
      >
        <CircleHelp strokeWidth={1} size={24} className="[html.mini-view_&]:size-6" />
      </div>
    </Tooltip>
  );
}
