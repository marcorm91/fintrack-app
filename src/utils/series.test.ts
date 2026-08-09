import { describe, expect, it } from 'vitest';
import {
  applyInvestmentPortfolioSetting,
  buildYearSeries,
  getBalanceTrend,
  getLatestClosingBalancePointAtOrBefore
} from './series';
import type { MonthlySeriesPoint } from '../db';

const point = (month: string, balanceCents: number): MonthlySeriesPoint => ({
  month,
  incomeCents: 0,
  expenseCents: 0,
  balanceCents,
  portfolioCents: 200,
  totalWealthCents: balanceCents + 200,
  benefitCents: 0,
  note: ''
});

describe('series utilities', () => {
  it('builds a full year with zero-filled missing months', () => {
    const result = buildYearSeries('2026', [point('2026-03', 1000)]);

    expect(result).toHaveLength(12);
    expect(result[0].month).toBe('2026-01');
    expect(result[0].balanceCents).toBe(0);
    expect(result[2].month).toBe('2026-03');
    expect(result[2].balanceCents).toBe(1000);
  });

  it('removes portfolio values when the setting is disabled', () => {
    expect(applyInvestmentPortfolioSetting(point('2026-08', 1000), false)).toMatchObject({
      portfolioCents: 0,
      totalWealthCents: 1000
    });
  });

  it('finds the latest closing balance at or before a month', () => {
    const result = getLatestClosingBalancePointAtOrBefore(
      [point('2026-01', 0), point('2026-02', 500), point('2026-04', 900)],
      '2026-03'
    );

    expect(result?.month).toBe('2026-02');
  });

  it('calculates balance trends', () => {
    expect(getBalanceTrend(2, 1)).toBe('up');
    expect(getBalanceTrend(1, 2)).toBe('down');
    expect(getBalanceTrend(1, 1)).toBe('flat');
  });
});
