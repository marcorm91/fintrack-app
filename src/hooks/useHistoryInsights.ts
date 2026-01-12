import { useMemo } from 'react';
import type { SeriesKey } from '../types';
import type { InsightComparison, InsightDelta, InsightsPayload } from '../types/insights';
import type { AllYearsPoint } from './useSeriesDerived';

type SeriesValues = Record<SeriesKey, number>;

type UseHistoryInsightsOptions = {
  allYears: AllYearsPoint[];
  allYearsSeriesVisibility: Record<SeriesKey, boolean>;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const SERIES_KEYS: SeriesKey[] = ['income', 'expense', 'balance', 'benefit'];

const getSeriesValues = (point: AllYearsPoint): SeriesValues => ({
  income: point.incomeCents,
  expense: point.expenseCents,
  balance: point.balanceCents,
  benefit: point.benefitCents
});

export function useHistoryInsights({
  allYears,
  allYearsSeriesVisibility,
  t
}: UseHistoryInsightsOptions) {
  return useMemo<InsightsPayload>(() => {
    const visibleKeys = SERIES_KEYS.filter((key) => allYearsSeriesVisibility[key]);
    const sortedByYear = [...allYears].sort((a, b) => a.year.localeCompare(b.year));
    const latest = sortedByYear[sortedByYear.length - 1] ?? null;
    const previous = sortedByYear[sortedByYear.length - 2] ?? null;

    const buildDeltas = (current: AllYearsPoint | null, base: AllYearsPoint | null) => {
      if (!current || !base || visibleKeys.length === 0) {
        return { hasData: false, deltas: [] as InsightDelta[] };
      }
      const currentValues = getSeriesValues(current);
      const baseValues = getSeriesValues(base);
      const deltas = visibleKeys.map((key) => {
        const deltaCents = currentValues[key] - baseValues[key];
        const baseValue = baseValues[key];
        const percentChange =
          baseValue === 0 ? null : (deltaCents / Math.abs(baseValue)) * 100;
        return {
          key,
          label: t(`series.${key}`),
          deltaCents,
          percentChange
        };
      });
      return { hasData: true, deltas };
    };

    const comparisonData = buildDeltas(latest, previous);

    const comparisons: InsightComparison[] = [
      {
        key: 'latestVsPreviousYear',
        label: t('insights.latestVsPreviousYear'),
        ...comparisonData
      }
    ];

    const hasAnyData = comparisons.some((comparison) => comparison.hasData && comparison.deltas.length > 0);

    return {
      comparisons,
      emptyLabel: t('insights.noComparison'),
      title: t('insights.title'),
      hasAnyData
    };
  }, [allYears, allYearsSeriesVisibility, t]);
}
