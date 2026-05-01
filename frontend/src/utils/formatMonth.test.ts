import { describe, it, expect } from 'vitest';
import { formatMonth, formatMonthRange } from './formatMonth';

describe('formatMonth', () => {
  it('formats a single month', () => {
    expect(formatMonth('2026-04')).toBe('Apr 2026');
    expect(formatMonth('2026-01')).toBe('Jan 2026');
    expect(formatMonth('2026-12')).toBe('Dec 2026');
  });

  it('returns raw string for invalid input', () => {
    expect(formatMonth('invalid')).toBe('invalid');
    expect(formatMonth('')).toBe('');
  });
});

describe('formatMonthRange', () => {
  it('formats a same-month range as a single month', () => {
    expect(formatMonthRange('2026-04', '2026-04')).toBe('Apr 2026');
  });
  it('formats a multi-month range', () => {
    expect(formatMonthRange('2026-02', '2026-03')).toBe('Feb – Mar 2026');
    expect(formatMonthRange('2025-11', '2026-01')).toBe('Nov 2025 – Jan 2026');
  });
});
