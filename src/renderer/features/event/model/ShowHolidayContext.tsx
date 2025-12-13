import { createContext, useContext, useState } from 'react';

const getInitialShowState = (): boolean => {
    const isShowHoliday = localStorage.getItem('holiday');
    return isShowHoliday === 'true';
};

export const ShowHolidayContext = createContext<{ isShow: boolean; handleShow: () => void }>({ isShow: true, handleShow: () => {} });

export function ShowHolidayProvider({ children }: { children: React.ReactNode }) {
    const [isShow, setShow] = useState(getInitialShowState());
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

    return <ShowHolidayContext.Provider value={{ isShow, handleShow }}>{children}</ShowHolidayContext.Provider>;
}

export const useShowHoliday = () => {
    const context = useContext(ShowHolidayContext);
    return context;
};
