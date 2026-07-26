import { http } from '@/shared/lib/http';
import { CalendarEvent, Events } from '@/shared/types/EventType';
import { GoogleEventBody } from '../types';

const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars';

// 안전 상한: 2500 × 20 = 5만 개 (요청 폭주 방지)
const MAX_PAGES = 20;

// 과거 2년 ~ 미래 2년 범위만 조회 (반복 일정의 무한 확장 방지 + 폴링 시 불필요한 과거 일정 재요청 절감)
const getTimeRange = () => {
  const now = new Date();
  const timeMin = new Date(now.getFullYear() - 2, now.getMonth(), 1).toISOString();
  const timeMax = new Date(now.getFullYear() + 2, now.getMonth(), 1).toISOString();
  return `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;
};

const fetchAllPages = async (url: string): Promise<{ items: Events[] }> => {
  const items: Events[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const pageUrl = pageToken ? `${url}&pageToken=${encodeURIComponent(pageToken)}` : url;
    const res = await http.get<{ items: Events[]; nextPageToken?: string }>(pageUrl, {});
    items.push(...(res.items ?? []));
    pageToken = res.nextPageToken;
    if (!pageToken) break;
  }
  return { items };
};

export const eventApi = {
  getEvents: () => {
    return fetchAllPages(`${CALENDAR_API_URL}/primary/events?maxResults=2500&singleEvents=true&${getTimeRange()}`);
  },
  getHolidays: () => {
    return fetchAllPages(`${CALENDAR_API_URL}/ko.south_korea%23holiday%40group.v.calendar.google.com/events?maxResults=2500&${getTimeRange()}`);
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
  }
};
