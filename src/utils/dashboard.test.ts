import { describe, expect, it } from 'vitest';
import type { MonthlySeriesPoint } from '../db';
import { getDashboardPeriods } from './dashboard';
import { getClosedMonthlySeries } from './series';

const point = (month: string, incomeCents = 0, expenseCents = 0): MonthlySeriesPoint => ({
  month, incomeCents, expenseCents, benefitCents: incomeCents - expenseCents,
  balanceCents: 0, portfolioCents: 0, totalWealthCents: 0, note: ''
});

describe('dashboard periods', () => {
  it('uses the latest stored month, including zero-valued records, regardless of input order', () => {
    const data = [point('2026-09'), point('2026-03', 10000), point('2025-12', 20000)];
    const result = getDashboardPeriods(data, '2026');
    expect(result.latestMonth?.month).toBe('2026-09');
    expect(result.yearSeries.map(p => p.month)).toEqual(['2026-03', '2026-09']);
    expect(data[0].month).toBe('2026-09');
  });
  it('keeps the last December record when entering January without inventing a January record', () => {
    const result = getDashboardPeriods([point('2026-12', 12345, 4567)], '2027');
    expect(result.latestMonth?.month).toBe('2026-12');
    expect(result.yearSeries).toEqual([]);
    expect(result.yearTotals).toEqual({ incomeCents: 0, expenseCents: 0, benefitCents: 0 });
  });
  it('sums only the current year in integer cents, including negative net income', () => {
    const result = getDashboardPeriods([point('2025-12', 99999), point('2026-01', 10001, 20002), point('2026-03', 111, 222)], '2026');
    expect(result.yearTotals).toEqual({ incomeCents: 10112, expenseCents: 20224, benefitCents: -10112 });
  });
  it('uses the existing cutoff to exclude future records', () => {
    const series = getClosedMonthlySeries([point('2026-09'), point('2026-11')], '2026-10');
    expect(getDashboardPeriods(series, '2026').latestMonth?.month).toBe('2026-09');
  });
  it('handles an empty database', () => {
    const result = getDashboardPeriods([], '2026');
    expect(result.latestMonth).toBeNull();
    expect(result.yearSeries).toEqual([]);
  });
});
