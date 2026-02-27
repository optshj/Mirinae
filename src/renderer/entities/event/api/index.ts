import { http } from '@/shared/lib/http';
import { CalendarEvent, Events } from '@/shared/types/EventType';
import { AddEventProp } from '../types';

const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars';

export const eventApi = {
  getEvents: (accessToken: string) => {
    return http.get<{ items: Events[] }>(`${CALENDAR_API_URL}/primary/events?maxResults=2500`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },
  getHolidays: (accessToken: string) => {
    return http.get<{ items: Events[] }>(`${CALENDAR_API_URL}/ko.south_korea%23holiday%40group.v.calendar.google.com/events?maxResults=2500`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },
  create: ({ accessToken, eventData }: { accessToken: string; eventData: AddEventProp }) => {
    return http.post<CalendarEvent>(`${CALENDAR_API_URL}/primary/events`, eventData, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  },
  delete: async ({ accessToken, eventId }: { accessToken: string; eventId: string }) => {
    return http.delete(`${CALENDAR_API_URL}/primary/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  },
  update: ({ accessToken, eventId, eventData }: { accessToken: string; eventId: string; eventData: any }) => {
    return http.put<CalendarEvent>(`${CALENDAR_API_URL}/primary/events/${eventId}`, eventData, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  },
  complete: ({ accessToken, eventId, patchBody }: { accessToken: string; eventId: string; patchBody: any }) => {
    return http.patch<CalendarEvent>(`${CALENDAR_API_URL}/primary/events/${eventId}`, patchBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }
};
