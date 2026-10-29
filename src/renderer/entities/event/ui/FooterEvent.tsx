import dayjs from 'dayjs';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CalendarEvent } from '@/shared/types/EventType';
import { cn } from '@/shared/lib/utils';
import { getEventRange } from '../lib/eventLayout';

const PAGE_SIZE = 4;

interface FooterEventProps {
  items: CalendarEvent[];
  title: React.ReactNode;
  description: string;
  headerButton?: React.ReactNode;
  hideDate?: boolean;
}
export function FooterEvent({ items, title, description, headerButton, hideDate }: FooterEventProps) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visibleItems = items.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="border-surface flex min-w-0 flex-col border-l p-4 first:border-l-0">
      <div className="flex h-9 shrink-0 items-center gap-2">
        <h3 className="text-primary min-w-0 text-sm font-semibold whitespace-nowrap">{title}</h3>
        {headerButton}

        {pages > 1 && (
          <div className="ml-auto flex items-center">
            <Button onClick={() => setPage(current - 1)} disabled={current === 0} variant="ghost" size="icon" className="size-7" tabIndex={-1}>
              <ChevronUp size={18} />
            </Button>
            <Button onClick={() => setPage(current + 1)} disabled={current === pages - 1} variant="ghost" size="icon" className="size-7" tabIndex={-1}>
              <ChevronDown size={18} />
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <span className="text-font-gray m-auto text-[13px] font-medium whitespace-nowrap">{description}</span>
      ) : (
        <div className="flex flex-col">
          {visibleItems.map((event) => (
            <FooterEventRow key={event.id} event={event} hideDate={hideDate} />
          ))}
        </div>
      )}
    </section>
  );
}

function FooterEventRow({ event, hideDate }: { event: CalendarEvent; hideDate?: boolean }) {
  const [start, end] = getEventRange(event);
  const isBar = event.category !== 'time' || start !== end;
  const completed = event.extendedProperties?.private?.completed === 'true';
  const day = dayjs(start);
  const time = event.category === 'time' ? dayjs(event.start.dateTime).format('HH:mm') : start !== end ? `~${dayjs(end).date()}일` : '종일';
  const date = day.isSame(dayjs(), 'day') ? '오늘' : day.isSame(dayjs().add(1, 'day'), 'day') ? '내일' : day.format('M/D');
  const meta = cn('text-xs whitespace-nowrap tabular-nums', completed ? 'text-secondary line-through' : 'text-zinc-500 dark:text-zinc-400');

  return (
    <div className={cn('grid h-7 items-center gap-2.5 text-[13px]', hideDate ? 'grid-cols-[0.5rem_minmax(0,1fr)_2.25rem]' : 'grid-cols-[0.5rem_minmax(0,1fr)_2.5rem_2.25rem]')}>
      <i className={cn(`event-color-${event.colorId} justify-self-center rounded-full bg-(--event-color) dark:saturate-70`, isBar ? 'h-3 w-1' : 'h-2 w-2')} />
      <span className={cn('truncate font-medium', completed ? 'text-secondary line-through' : 'text-primary')}>{event.summary}</span>
      {!hideDate && <span className={meta}>{date}</span>}
      <span className={cn(meta, 'text-right')}>{time}</span>
    </div>
  );
}
