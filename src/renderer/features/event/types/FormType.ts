export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;

export interface FormState {
  summary: string;
  colorId: string;
  start: string;
  end: string;
  allDay: boolean;
  recurrence: RecurrenceType;
}
