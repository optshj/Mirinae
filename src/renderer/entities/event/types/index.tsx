export interface AddEventProp {
  date: Date;
  start: string;
  end: string;
  summary: string;
  colorId: string;
  allDay: boolean;
}

export interface GoogleEventBody {
  summary: string;
  colorId: string;
  start: {
    date?: string; // 종일 일정일 때
    dateTime?: string; // 시간 지정 일정일 때
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
}

export interface CompleteEventBody {
  extendedProperties: {
    private: {
      isCompleted: string;
    };
  };
}
