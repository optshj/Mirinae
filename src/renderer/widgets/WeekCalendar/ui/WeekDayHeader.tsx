import dayjs from 'dayjs';

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

export function WeekDayHeader({ weekDays }: { weekDays: Date[] }) {
  return (
    <div className="bg-background-primary grid shrink-0 grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] py-2 text-center">
      <div />
      {weekDays.map((date) => {
        const dayOfWeek = date.getDay();
        const isToday = dayjs(date).isSame(dayjs(), 'day');
        return (
          <div key={dayjs(date).format('YYYY-MM-DD')} className="flex flex-col items-center gap-1">
            <span className={`${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-primary'}`}>{WEEKDAY_LABEL[dayOfWeek]}</span>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold dark:saturate-70 ${isToday ? 'bg-main-color text-bg-gray dark:text-[#333333]' : 'text-primary'}`}>
              {date.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
