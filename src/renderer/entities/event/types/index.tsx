export interface EventBodyProp {
  start: string;
  end: string;
  startDate: string;
  endDate: string;
  summary: string;
  colorId: string;
  allDay: boolean;
  recurrence?: string | null;
}
export interface EditEventProp extends EventBodyProp {
  eventId: string;
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
