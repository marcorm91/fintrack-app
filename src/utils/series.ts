import type { MonthlySeriesPoint, MonthlySummary } from '../db';
import type { BalanceTrend } from '../types';

export function summaryFromSeries(point: MonthlySeriesPoint): MonthlySummary {
  return {
    month: point.month,
    incomeCents: point.incomeCents,
    expenseCents: point.expenseCents,
    balanceCents: point.balanceCents,
    portfolioCents: point.portfolioCents,
    totalWealthCents: point.totalWealthCents,
    benefitCents: point.benefitCents
  };
}

export function applyInvestmentPortfolioSetting<T extends MonthlySummary | MonthlySeriesPoint>(
  point: T,
  enabled: boolean
): T {
  if (enabled) {
    return point;
  }
  return {
    ...point,
    portfolioCents: 0,
    totalWealthCents: point.balanceCents
  };
}

export function buildYearSeries(year: string, series: MonthlySeriesPoint[]): MonthlySeriesPoint[] {
  const map = new Map(series.filter((point) => point.month.startsWith(`${year}-`)).map((point) => [point.month, point]));
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    const point = map.get(key);
    return (
      point ?? {
        month: key,
        incomeCents: 0,
        expenseCents: 0,
        balanceCents: 0,
        portfolioCents: 0,
        totalWealthCents: 0,
        benefitCents: 0
      }
    );
  });
}

export function getLatestSeriesPointAtOrBefore(
  series: MonthlySeriesPoint[],
  monthValue: string
): MonthlySeriesPoint | null {
  return series.reduce<MonthlySeriesPoint | null>(
    (latest, point) =>
      point.month <= monthValue && (!latest || point.month > latest.month) ? point : latest,
    null
  );
}

export function getBalanceTrend(current: number, previous: number): BalanceTrend {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}
