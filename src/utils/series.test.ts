import { describe, expect, it } from 'vitest';
import {
  applyInvestmentPortfolioSetting,
  buildYearSeries,
  getBalanceTrend,
  getClosedMonthlySeries,
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
  it('keeps only recorded months for the selected year', () => {
    const result = buildYearSeries('2026', [
      point('2026-03', 1000),
      point('2025-12', 800),
      point('2026-01', 900)
    ]);

    expect(result.map((item) => item.month)).toEqual(['2026-01', '2026-03']);
    expect(result.some((item) => item.month === '2026-02')).toBe(false);
  });

  it('does not turn an unrecorded month into a zero-valued period', () => {
    const result = buildYearSeries('2026', [point('2026-08', 1000)]);

    expect(result).toHaveLength(1);
    expect(result[0].month).toBe('2026-08');
    expect(result.some((item) => item.month === '2026-09')).toBe(false);
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

  it('includes the current month in insights and keeps future months out', () => {
    expect(
      getClosedMonthlySeries(
        [point('2026-07', 700), point('2026-08', 800), point('2026-09', 900)],
        '2026-08'
      ).map((item) => item.month)
    ).toEqual(['2026-07', '2026-08']);
  });

  it('calculates balance trends', () => {
    expect(getBalanceTrend(2, 1)).toBe('up');
    expect(getBalanceTrend(1, 2)).toBe('down');
    expect(getBalanceTrend(1, 1)).toBe('flat');
  });
});
