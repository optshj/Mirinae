import { http } from '@/shared/lib/http';
import { CalendarEvent, Events } from '@/shared/types/EventType';
import { CompleteEventBody, GoogleEventBody } from '../types';

const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars';

export const eventApi = {
  getEvents: () => {
    return http.get<{ items: Events[] }>(`${CALENDAR_API_URL}/primary/events?maxResults=2500&singleEvents=true`, {}).then((res) => {
      console.log(res);
      return res;
    });
  },
  getHolidays: () => {
    return http.get<{ items: Events[] }>(`${CALENDAR_API_URL}/ko.south_korea%23holiday%40group.v.calendar.google.com/events?maxResults=2500`, {});
  },
  create: (eventData: GoogleEventBody) => {
    return http.post<Events>(`${CALENDAR_API_URL}/primary/events`, eventData);
  },
  delete: async (eventId: string) => {
    return http.delete(`${CALENDAR_API_URL}/primary/events/${eventId}`);
  },
  // 삭제된 일정은 status: 'cancelled'로 남아 있어서 confirmed로 patch하면 복원됨 (반복 일정 부모/인스턴스 포함)
  restore: (eventId: string) => {
    return http.patch<Events>(`${CALENDAR_API_URL}/primary/events/${eventId}`, { status: 'confirmed' });
  },
  update: ({ eventId, eventData }: { eventId: string; eventData: GoogleEventBody }) => {
    return http.put<CalendarEvent>(`${CALENDAR_API_URL}/primary/events/${eventId}`, eventData);
  },
  complete: ({ eventId, patchBody }: { eventId: string; patchBody: CompleteEventBody }) => {
    return http.patch<CalendarEvent>(`${CALENDAR_API_URL}/primary/events/${eventId}`, patchBody);
  }
};
