export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;

export interface FormState {
  summary: string;
  colorId: string;
  start: string;
  startDate: string;
  end: string;
  endDate: string;
  allDay: boolean;
  recurrence: RecurrenceType;
}
