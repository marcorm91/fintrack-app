import type { MonthlySeriesPoint, MonthlySummary } from '../db';
import type { BalanceTrend } from '../types';

export function summaryFromSeries(point: MonthlySeriesPoint): MonthlySummary {
  return {
    month: point.month,
    incomeCents: point.incomeCents,
    expenseCents: point.expenseCents,
    balanceCents: point.balanceCents,
    portfolioCents: point.portfolioCents,
    portfolioContributionCents: point.portfolioContributionCents ?? null,
    totalWealthCents: point.totalWealthCents,
    benefitCents: point.benefitCents,
    note: point.note
  };
}

export function applyInvestmentPortfolioSetting<T extends MonthlySummary | MonthlySeriesPoint>(
  point: T,
  enabled: boolean
): T {
  if (enabled) {
    return point;
  }
  const withoutPortfolio = {
    ...point,
    portfolioCents: 0,
    portfolioContributionCents: null,
    totalWealthCents: point.balanceCents
  };
  if ('portfolioResultCents' in point) {
    return {
      ...withoutPortfolio,
      portfolioInvestedCents: null,
      portfolioResultCents: null
    } as T;
  }
  return withoutPortfolio as T;
}

export function getClosedMonthlySeries(
  series: MonthlySeriesPoint[],
  currentMonthValue: string
): MonthlySeriesPoint[] {
  return series.filter((point) => point.month <= currentMonthValue);
}

export function buildYearSeries(year: string, series: MonthlySeriesPoint[]): MonthlySeriesPoint[] {
  return series
    .filter((point) => point.month.startsWith(`${year}-`))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function hasClosingBalanceEntry(point: Pick<MonthlySeriesPoint, 'balanceCents'>) {
  return point.balanceCents !== 0;
}

export function getLatestClosingBalancePointAtOrBefore(
  series: MonthlySeriesPoint[],
  monthValue: string
): MonthlySeriesPoint | null {
  return series.reduce<MonthlySeriesPoint | null>(
    (latest, point) =>
      point.month <= monthValue &&
      hasClosingBalanceEntry(point) &&
      (!latest || point.month > latest.month)
        ? point
        : latest,
    null
  );
}

export function getBalanceTrend(current: number, previous: number): BalanceTrend {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}
