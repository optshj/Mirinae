import { useColorLabels } from '@/entities/event';
import { COLORPALLETTE } from '@/shared/const/color';
import { HangulInput } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';

interface ColorChipsProps {
  isSelected: (colorId: string) => boolean;
  onSelect: (colorId: string) => void;
  /** 넘기면 그 색의 이름을 바로 지을 수 있는 입력 줄이 아래에 붙는다 */
  naming?: string;
  className?: string;
}

/**
 * 색상 선택 UI. 이름이 붙은 색은 이름을 통째로 보여주는 칩으로, 안 붙은 색은 점으로 나열한다.
 * 칩은 폭이 모자라면 다음 줄로 흐르고 이름은 칩 안에서 줄바꿈되므로 이름 길이에 제한이 없다.
 */
export function ColorChips({ isSelected, onSelect, naming, className }: ColorChipsProps) {
  const { labels, setLabel } = useColorLabels();
  const named = COLORPALLETTE.filter((key) => labels[key]);
  const unnamed = COLORPALLETTE.filter((key) => !labels[key]);

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      {named.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {named.map((key) => (
            <button
              key={key}
              type="button"
              tabIndex={-1}
              onClick={() => onSelect(key)}
              className={cn(
                'text-primary flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs transition-colors dark:saturate-70',
                `event-color-${key}`,
                isSelected(key) ? 'border-transparent bg-(--event-color)/20' : 'border-(--event-color) hover:bg-(--event-color)/5'
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-(--event-color)" />
              <span className="min-w-0 break-words">{labels[key]}</span>
            </button>
          ))}
        </div>
      )}

      {unnamed.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unnamed.map((key) => (
            <button
              key={key}
              type="button"
              tabIndex={-1}
              aria-label={`${key}번 색상`}
              onClick={() => onSelect(key)}
              className={cn('flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors', isSelected(key) ? 'border-zinc-400 dark:border-zinc-300' : 'border-transparent')}
            >
              <span className={cn('h-5 w-5 rounded-full dark:saturate-70', `event-color-${key} bg-(--event-color)`)} />
            </button>
          ))}
        </div>
      )}

      {naming && (
        // 메뉴 안에서 쓰일 때 타이핑 검색(typeahead)이 입력을 가로채지 않도록 차단. Escape는 닫기용으로 통과시킨다
        <div
          onKeyDown={(event) => event.key !== 'Escape' && event.stopPropagation()}
          className={cn('flex items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-700', `event-color-${naming} dark:saturate-70`)}
        >
          <span className="h-3 w-3 shrink-0 rounded-full bg-(--event-color)" />
          <HangulInput value={labels[naming] ?? ''} onChange={(value) => setLabel(naming, value)} placeholder="무슨 일정에 쓸 색인가요?" className="text-primary w-full py-0.5 text-xs" />
        </div>
      )}
    </div>
  );
}
