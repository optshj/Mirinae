import { useState } from 'react';

import { ScheduleModal } from './ScheduleModal';

import { useCalendarItems } from '@/features/event';

import { EventList } from '@/entities/event';

import { isSameDay } from '@/shared/lib/dateFunction';
import { Dialog, DialogTrigger } from '@/shared/ui/dialog';
import { isTimeEvent } from '@/shared/types/EventType';
import { DateProps } from '@/shared/lib/useDate';

export function CalendarGrid({ days, month }: Pick<DateProps, 'days' | 'month'>) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [open, setOpen] = useState(false);

    const { items } = useCalendarItems();

    const handleDateDoubleClick = (date: Date) => {
        setSelectedDate(date);
        setOpen(true);
    };

    return (
        <div className="bg-primary flex flex-1 flex-col overflow-hidden rounded-xl">
            <div className="grid grid-cols-7 bg-[#F9FAFB] py-2 text-center font-semibold dark:bg-zinc-800">
                <div className="text-red-400" aria-label="일요일">
                    일
                </div>
                {['월', '화', '수', '목', '금'].map((day) => (
                    <div className="text-primary" key={day}>
                        {day}
                    </div>
                ))}
                <div className="text-blue-400" aria-label="토요일">
                    토
                </div>
            </div>
            <div className="grid h-[calc(100vh-20rem)] grid-cols-7 grid-rows-[repeat(6,1fr)] transition-all duration-300 ease-in-out [html.flip-footer_&]:h-[calc(100vh-7.5rem)]">
                <Dialog open={open} onOpenChange={setOpen}>
                    {days.map((date, i) => {
                        const isCurrentMonth = date.getMonth() === month;
                        const isToday = isSameDay(new Date(), date);
                        const events = items?.filter((item) => {
                            const eventDate = isTimeEvent(item) ? new Date(item.start.dateTime) : new Date(item.start.date);
                            return isSameDay(eventDate, date);
                        });
                        return (
                            <DialogTrigger key={i} asChild>
                                <div className={`border-primary flex h-full w-full flex-1 flex-col overflow-hidden border py-1`} onClick={() => handleDateDoubleClick(date)}>
                                    <div className={`px-1 font-semibold ${isCurrentMonth ? 'text-primary' : 'text-secondary'} `}>
                                        <div className={`${isToday ? 'bg-main-color text-[#f3f4f6] dark:text-[#333333]' : ''} flex h-6 w-6 items-center justify-center rounded-full dark:saturate-70`}>
                                            {date.getDate()}
                                        </div>
                                    </div>
                                    <EventList items={events} />
                                </div>
                            </DialogTrigger>
                        );
                    })}
                    <ScheduleModal date={selectedDate} />
                </Dialog>
            </div>
        </div>
    );
}
