import type { MonthlySeriesPoint } from '../db';
import { buildYearSeries } from './series';

// Stored zero-valued snapshots count as records; do not use the closing-balance heuristic.
export function getDashboardPeriods(series: MonthlySeriesPoint[], currentYear: string) {
  const latestMonth = series.reduce<MonthlySeriesPoint | null>((latest, point) =>
    !latest || point.month > latest.month ? point : latest, null);
  const yearSeries = buildYearSeries(currentYear, series);
  const yearTotals = yearSeries.reduce((total, point) => ({
    incomeCents: total.incomeCents + point.incomeCents,
    expenseCents: total.expenseCents + point.expenseCents,
    benefitCents: total.benefitCents + point.benefitCents
  }), { incomeCents: 0, expenseCents: 0, benefitCents: 0 });
  return { latestMonth, yearSeries, yearTotals };
}
