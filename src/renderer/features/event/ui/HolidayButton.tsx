import { useHoliday } from '@/entities/event';
import { Switch } from '@/shared/ui/switch';

export function HolidayButton() {
  const { showHoliday, setShowHoliday } = useHoliday();

  const handleToggle = () => {
    setShowHoliday(!showHoliday);
  };

  return (
    <div className="flex flex-row items-center justify-between gap-4">
      <label htmlFor="holiday-toggle">공휴일 표시</label>
      <Switch id="holiday-toggle" onClick={handleToggle} isOn={showHoliday} />
    </div>
  );
}
