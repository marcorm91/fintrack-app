import { useMemo } from 'react';
import type { MonthlySeriesPoint, MonthlySummary } from '../db';
import type { SeriesKey } from '../types';
import type { InsightDelta, InsightComparison, InsightsPayload } from '../types/insights';
import { shiftMonthValue } from '../utils/date';

type SeriesValues = Record<SeriesKey, number>;

type UseMonthlyInsightsOptions = {
  monthValue: string;
  displaySummary: MonthlySummary;
  series: MonthlySeriesPoint[];
  monthSeriesVisibility: Record<SeriesKey, boolean>;
  hasMonthData: boolean;
  isCurrentMonth: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const SERIES_KEYS: SeriesKey[] = ['income', 'expense', 'balance', 'benefit'];

const getSeriesValues = (point: MonthlySummary | MonthlySeriesPoint): SeriesValues => ({
  income: point.incomeCents,
  expense: point.expenseCents,
  balance: point.balanceCents,
  benefit: point.benefitCents
});

export function useMonthlyInsights({
  monthValue,
  displaySummary,
  series,
  monthSeriesVisibility,
  hasMonthData,
  isCurrentMonth,
  t
}: UseMonthlyInsightsOptions) {
  return useMemo<InsightsPayload>(() => {
    if (isCurrentMonth && !hasMonthData) {
      return {
        comparisons: [],
        emptyLabel: t('insights.noCurrentData'),
        title: t('insights.title'),
        currentLabel: t('insights.current'),
        previousLabel: t('insights.previous'),
        hasAnyData: false
      };
    }

    const currentValues = getSeriesValues(displaySummary);
    const visibleKeys = SERIES_KEYS.filter((key) => monthSeriesVisibility[key]);
    const previousMonthValue = shiftMonthValue(monthValue, -1);
    const previousYearValue = shiftMonthValue(monthValue, -12);
    const previousMonth = series.find((point) => point.month === previousMonthValue) ?? null;
    const previousYear = series.find((point) => point.month === previousYearValue) ?? null;

    const buildDeltas = (point: MonthlySeriesPoint | null) => {
      if (!point) {
        return { hasData: false, deltas: [] as InsightDelta[] };
      }
      const previousValues = getSeriesValues(point);
      const deltas = visibleKeys.map((key) => {
        const deltaCents = currentValues[key] - previousValues[key];
        const baseValue = previousValues[key];
        const percentChange =
          baseValue === 0 ? null : (deltaCents / Math.abs(baseValue)) * 100;
        return {
          key,
          label: t(`series.${key}`),
          deltaCents,
          percentChange,
          currentCents: currentValues[key],
          previousCents: previousValues[key]
        };
      });
      return { hasData: true, deltas };
    };

    const previousMonthData = buildDeltas(previousMonth);
    const previousYearData = buildDeltas(previousYear);

    const comparisons: InsightComparison[] = [
      {
        key: 'previousMonth',
        label: t('insights.previousMonth'),
        ...previousMonthData
      },
      {
        key: 'previousYear',
        label: t('insights.previousYear'),
        ...previousYearData
      }
    ];

    const hasAnyData = comparisons.some((comparison) => comparison.hasData && comparison.deltas.length > 0);

    return {
      comparisons,
      emptyLabel: t('insights.noComparison'),
      title: t('insights.title'),
      currentLabel: t('insights.current'),
      previousLabel: t('insights.previous'),
      hasAnyData
    };
  }, [displaySummary, hasMonthData, isCurrentMonth, monthSeriesVisibility, monthValue, series, t]);
}
