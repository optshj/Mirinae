import { Switch } from '@/shared/ui/switch';
import { usePreference } from '@/shared/lib/preferences';

export function FlipFooterButton() {
  const [isFlip, setIsFlip] = usePreference('flipFooter');

  return (
    <div className="flex flex-row items-center justify-between gap-4">
      <label htmlFor="flip-footer-toggle">일정 요약 숨기기</label>
      <Switch id="flip-footer-toggle" onClick={() => setIsFlip(!isFlip)} isOn={isFlip} />
    </div>
  );
}
