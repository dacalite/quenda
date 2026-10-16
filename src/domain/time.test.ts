// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import {
  addDays,
  byDateAndStart,
  daypart,
  daysBetween,
  fromMinutes,
  isInDateRange,
  minutesBetween,
  rangesOverlap,
  startOfWeek,
  toMinutes,
  weekdayOf,
  zonedNow,
} from './time';

describe('time helpers', () => {
  it('converts between HH:mm and minutes', () => {
    expect(toMinutes('18:30')).toBe(1110);
    expect(fromMinutes(1110)).toBe('18:30');
    expect(fromMinutes(0)).toBe('00:00');
  });

  it('adds days across months, years and DST changes', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-25', -1)).toBe('2026-10-24');
    expect(daysBetween('2026-10-19', '2026-11-02')).toBe(14);
  });

  it('uses ISO weekdays starting on Monday', () => {
    expect(weekdayOf('2026-10-19')).toBe(1);
    expect(weekdayOf('2026-10-25')).toBe(7);
    expect(startOfWeek('2026-10-25')).toBe('2026-10-19');
    expect(startOfWeek('2026-10-19')).toBe('2026-10-19');
  });

  it('checks date ranges and time overlaps with exclusive ends', () => {
    expect(isInDateRange('2026-10-20', { from: '2026-10-20', to: '2026-10-20' })).toBe(true);
    expect(isInDateRange('2026-10-21', { from: '2026-10-19', to: '2026-10-20' })).toBe(false);
    expect(rangesOverlap({ start: '18:00', end: '19:00' }, { start: '18:30', end: '20:00' })).toBe(
      true,
    );
    expect(rangesOverlap({ start: '18:00', end: '19:00' }, { start: '19:00', end: '20:00' })).toBe(
      false,
    );
  });

  it('measures minutes between local date-times', () => {
    expect(
      minutesBetween({ date: '2026-10-19', time: '23:00' }, { date: '2026-10-20', time: '01:30' }),
    ).toBe(150);
  });

  it('groups times into morning, afternoon and evening', () => {
    expect(['09:00', '13:30', '14:00', '19:30', '20:00', '22:30'].map(daypart)).toEqual([
      'morning',
      'morning',
      'afternoon',
      'afternoon',
      'evening',
      'evening',
    ]);
  });

  it('reads the wall-clock time of a time zone', () => {
    expect(zonedNow(new Date('2026-10-19T22:30:00Z'), 'Europe/Madrid')).toEqual({
      date: '2026-10-20',
      time: '00:30',
    });
    expect(zonedNow(new Date('2026-07-01T10:00:00Z'), 'Europe/Madrid').time).toBe('12:00');
  });
});

describe('byDateAndStart', () => {
  it('orders by day first, then by start time', () => {
    const rows = [
      { date: '2026-10-21', start: '09:00' },
      { date: '2026-10-20', start: '18:00' },
      { date: '2026-10-20', start: '10:00' },
    ];
    expect(rows.toSorted(byDateAndStart).map((r) => `${r.date} ${r.start}`)).toEqual([
      '2026-10-20 10:00',
      '2026-10-20 18:00',
      '2026-10-21 09:00',
    ]);
  });
});
