import { useShowHoliday } from '@/features/event/model/ShowHolidayContext';
import { Switch } from '@/shared/ui/switch';

export function HolidayButton() {
    const { isShow, handleShow } = useShowHoliday();
    return (
        <div className="flex flex-row justify-between">
            <label>공휴일표시</label>
            <Switch onClick={() => handleShow()} isOn={isShow} />
        </div>
    );
}
