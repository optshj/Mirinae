import { createContext, useContext, useEffect, useState } from 'react';

export const ShowHolidayContext = createContext<{ isShow: boolean; handleShow: () => void }>({ isShow: true, handleShow: () => {} });
export function ShowHolidayProvider({ children }: { children: React.ReactNode }) {
    const [isShow, setShow] = useState(true);
    const updateShowHoliday = (isShow: boolean) => {
        setShow(isShow);
        if (isShow) {
            localStorage.holiday = 'true';
        } else {
            localStorage.holiday = 'false';
        }
    };

    const handleShow = () => {
        updateShowHoliday(!isShow);
    };

    useEffect(() => {
        const isShow = localStorage.holiday === 'true' || !('holiday' in localStorage);
        updateShowHoliday(isShow);
    }, []);
    return <ShowHolidayContext.Provider value={{ isShow, handleShow }}>{children}</ShowHolidayContext.Provider>;
}

export const useShowHoliday = () => {
    const context = useContext(ShowHolidayContext);
    return context;
};
