import { useState } from 'react';

export type DateProps = {
    days: Date[];
    year: number;
    month: number;
    displayMonth: number;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
};

export function useDate(): DateProps {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const displayMonth = (month + 1) % 12 || 12;
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();

    const calendarStartDate = new Date(year, month, 1 - startDayOfWeek);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const date = new Date(calendarStartDate);
        date.setDate(calendarStartDate.getDate() + i);
        days.push(date);
    }
    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    return {
        days,
        year,
        month,
        displayMonth,
        handlePrevMonth,
        handleNextMonth
    };
}
