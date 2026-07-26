import { describe, expect, it } from 'vitest';
import { buildDayTimeSegments } from './eventLayout';
import { TimeEvent } from '@/shared/types/EventType';

function timeEvent(id: string, date: string, startHHmm: string, endHHmm: string): TimeEvent {
  return {
    id,
    summary: id,
    colorId: '1',
    category: 'time',
    start: { dateTime: `${date}T${startHHmm}:00`, timeZone: 'Asia/Seoul' },
    end: { dateTime: `${date}T${endHHmm}:00`, timeZone: 'Asia/Seoul' }
  } as TimeEvent;
}

describe('buildDayTimeSegments', () => {
  it('non-overlapping events each take the full column', () => {
    const events = [timeEvent('a', '2026-01-05', '09:00', '10:00'), timeEvent('b', '2026-01-05', '11:00', '12:00')];
    const segments = buildDayTimeSegments(events, '2026-01-05');
    expect(segments).toHaveLength(2);
    segments.forEach((seg) => {
      expect(seg.col).toBe(0);
      expect(seg.colCount).toBe(1);
    });
  });

  it('splits two overlapping events 50/50', () => {
    const events = [timeEvent('a', '2026-01-05', '09:00', '10:00'), timeEvent('b', '2026-01-05', '09:30', '10:30')];
    const segments = buildDayTimeSegments(events, '2026-01-05');
    const a = segments.find((s) => s.event.id === 'a')!;
    const b = segments.find((s) => s.event.id === 'b')!;
    expect(a.colCount).toBe(2);
    expect(b.colCount).toBe(2);
    expect(a.col).not.toBe(b.col);
  });

  it('groups a chain of overlaps (A-B, B-C, A/C not overlapping) into one cluster', () => {
    const events = [timeEvent('a', '2026-01-05', '09:00', '10:00'), timeEvent('b', '2026-01-05', '09:30', '11:00'), timeEvent('c', '2026-01-05', '10:30', '11:30')];
    const segments = buildDayTimeSegments(events, '2026-01-05');
    const a = segments.find((s) => s.event.id === 'a')!;
    const b = segments.find((s) => s.event.id === 'b')!;
    const c = segments.find((s) => s.event.id === 'c')!;
    // 어느 순간에도 최대 2개까지만 동시에 겹치므로 colCount는 2
    expect(a.colCount).toBe(2);
    expect(b.colCount).toBe(2);
    expect(c.colCount).toBe(2);
    expect(a.col).not.toBe(b.col);
    expect(b.col).not.toBe(c.col);
  });

  it('clips an event spanning midnight to the requested day', () => {
    const event: TimeEvent = {
      id: 'overnight',
      summary: 'overnight',
      colorId: '1',
      category: 'time',
      start: { dateTime: '2026-01-05T22:00:00', timeZone: 'Asia/Seoul' },
      end: { dateTime: '2026-01-06T02:00:00', timeZone: 'Asia/Seoul' }
    } as TimeEvent;

    const day1 = buildDayTimeSegments([event], '2026-01-05');
    expect(day1).toHaveLength(1);
    expect(day1[0].startMin).toBe(22 * 60);
    expect(day1[0].endMin).toBe(1440);
    expect(day1[0].isStart).toBe(true);
    expect(day1[0].isEnd).toBe(false);

    const day2 = buildDayTimeSegments([event], '2026-01-06');
    expect(day2).toHaveLength(1);
    expect(day2[0].startMin).toBe(0);
    expect(day2[0].endMin).toBe(2 * 60);
    expect(day2[0].isStart).toBe(false);
    expect(day2[0].isEnd).toBe(true);
  });

  it('clamps very short events to a minimum visible height', () => {
    const events = [timeEvent('short', '2026-01-05', '09:00', '09:05')];
    const segments = buildDayTimeSegments(events, '2026-01-05');
    expect(segments[0].endMin - segments[0].startMin).toBeGreaterThanOrEqual(30);
  });
});
