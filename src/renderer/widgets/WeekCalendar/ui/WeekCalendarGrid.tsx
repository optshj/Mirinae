import { useState } from 'react';

import { ScheduleModal } from '@/widgets/Calendar';
import { useCalendarItems, useMaxLanes } from '@/entities/event';
import { useEventDrag, DragGhost } from '@/features/event-drag';
import { Dialog } from '@/shared/ui/dialog';

import { WeekDayHeader } from './WeekDayHeader';
import { WeekAllDayStrip } from './WeekAllDayStrip';
import { WeekTimeGrid } from './WeekTimeGrid';

export function WeekCalendarGrid({ weekDays }: { weekDays: Date[] }) {
  const [selected, setSelected] = useState<{ date: Date; hour: number } | null>(null);
  const [open, setOpen] = useState(false);
  const { items } = useCalendarItems();
  const { maxLanes } = useMaxLanes();
  const { drag, previewRange, ghostRef, posRef, startDrag } = useEventDrag();

  const openDay = (date: Date, hour: number) => {
    setSelected({ date, hour });
    setOpen(true);
  };

  return (
    <div className="bg-primary relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
      <WeekDayHeader weekDays={weekDays} />
      <div className="flex min-h-0 flex-1 flex-col">
        <WeekAllDayStrip
          weekDays={weekDays}
          items={items}
          maxLanes={maxLanes}
          onPickDate={(date) => openDay(date, 8)}
          onEventPointerDown={startDrag}
          draggingEventId={drag?.seg.event.id ?? null}
          previewRange={previewRange}
        />
        <WeekTimeGrid weekDays={weekDays} items={items} onOpenDay={openDay} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <ScheduleModal date={selected?.date ?? new Date()} initialHour={selected?.hour} />
      </Dialog>

      {drag && <DragGhost seg={drag.seg} ghost={drag.ghost} ghostRef={ghostRef} posRef={posRef} />}
    </div>
  );
}
