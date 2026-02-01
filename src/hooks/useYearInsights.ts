import { useMemo } from 'react';
import type { SeriesKey } from '../types';
import type { InsightComparison, InsightDelta, InsightsPayload } from '../types/insights';
import type { AllYearsPoint, YearTotals } from './useSeriesDerived';

type SeriesValues = Record<SeriesKey, number>;

type UseYearInsightsOptions = {
  yearValue: string;
  yearTotals: YearTotals;
  allYears: AllYearsPoint[];
  yearSeriesVisibility: Record<SeriesKey, boolean>;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const SERIES_KEYS: SeriesKey[] = ['income', 'expense', 'balance', 'benefit'];

const getSeriesValues = (point: YearTotals | AllYearsPoint): SeriesValues => ({
  income: point.incomeCents,
  expense: point.expenseCents,
  balance: point.balanceCents,
  benefit: point.benefitCents
});

export function useYearInsights({
  yearValue,
  yearTotals,
  allYears,
  yearSeriesVisibility,
  t
}: UseYearInsightsOptions) {
  return useMemo<InsightsPayload>(() => {
    const currentValues = getSeriesValues(yearTotals);
    const visibleKeys = SERIES_KEYS.filter((key) => yearSeriesVisibility[key]);
    const yearNumber = Number(yearValue);
    const previousYearValue = Number.isFinite(yearNumber) ? String(yearNumber - 1) : '';
    const previousYear = allYears.find((point) => point.year === previousYearValue) ?? null;

    const buildDeltas = (point: AllYearsPoint | null) => {
      if (!point || visibleKeys.length === 0) {
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

    const previousYearData = buildDeltas(previousYear);

    const comparisons: InsightComparison[] = [
      {
        key: 'previousYearTotal',
        label: t('insights.previousYearTotal'),
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
  }, [allYears, t, yearSeriesVisibility, yearTotals, yearValue]);
}
