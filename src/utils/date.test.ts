import { describe, expect, it } from 'vitest';
import { formatMonthValue, getMonthParts, shiftMonthValue, shiftYearValue } from './date';

describe('date utilities', () => {
  it('formats months with a leading zero', () => {
    expect(formatMonthValue(2026, 1)).toBe('2026-01');
    expect(formatMonthValue(2026, 12)).toBe('2026-12');
  });

  it('parses month values', () => {
    expect(getMonthParts('2026-08')).toEqual({ year: 2026, month: 8 });
  });

  it('shifts months across year boundaries', () => {
    expect(shiftMonthValue('2026-01', -1)).toBe('2025-12');
    expect(shiftMonthValue('2026-12', 1)).toBe('2027-01');
  });

  it('leaves invalid years unchanged when shifting years', () => {
    expect(shiftYearValue('2026', 1)).toBe('2027');
    expect(shiftYearValue('invalid', 1)).toBe('invalid');
  });
});
