import { useCallback, useMemo } from 'react';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import type { SeriesKey } from '../types';
import type { MonthlySeriesPoint } from '../db';
import type { AllYearsPoint } from './useSeriesDerived';
import { COLORS, X_TICK_FONT_SIZE } from '../constants';
import { getMonthLabel } from '../utils/date';
import { formatEuro } from '../utils/format';

type UseChartsOptions = {
  language: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  yearSeriesVisibility: Record<SeriesKey, boolean>;
  allYearsSeriesVisibility: Record<SeriesKey, boolean>;
  yearSeries: MonthlySeriesPoint[];
  allYears: AllYearsPoint[];
};

type SeriesChartData = ChartData<'bar', Array<number | null>, string>;
type SeriesChartOptions = ChartOptions<'bar'>;

export function useCharts({
  language,
  t,
  yearSeriesVisibility,
  allYearsSeriesVisibility,
  yearSeries,
  allYears
}: UseChartsOptions) {
  const translate = useCallback(
    (key: string, options?: Record<string, unknown>) => t(key, { ...options, lng: language }),
    [language, t]
  );

  const yearChartData = useMemo<SeriesChartData>(() => {
    const benefitColors = yearSeries.map((point) =>
      point.benefitCents < 0 ? COLORS.benefitNegative : COLORS.benefit
    );
    return {
      labels: yearSeries.map((point) => getMonthLabel(point.month, language, 'long')),
      datasets: [
        {
          label: translate('series.income'),
          data: yearSeries.map((point) => point.incomeCents / 100),
          backgroundColor: COLORS.income,
          borderColor: COLORS.income,
          pointBackgroundColor: COLORS.income,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.income
        },
        {
          label: translate('series.expense'),
          data: yearSeries.map((point) => point.expenseCents / 100),
          backgroundColor: COLORS.expense,
          borderColor: COLORS.expense,
          pointBackgroundColor: COLORS.expense,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.expense
        },
        {
          label: translate('series.benefit'),
          data: yearSeries.map((point) => point.benefitCents / 100),
          backgroundColor: benefitColors,
          borderColor: benefitColors,
          pointBackgroundColor: benefitColors,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.benefit
        }
      ]
    };
  }, [yearSeries, yearSeriesVisibility, language, translate]);

  const yearWealthChartData = useMemo<SeriesChartData>(
    () => ({
      labels: yearSeries.map((point) => getMonthLabel(point.month, language, 'long')),
      datasets: [
        {
          label: translate('series.balance'),
          data: yearSeries.map((point) => point.balanceCents / 100),
          backgroundColor: COLORS.balance,
          borderColor: COLORS.balance,
          pointBackgroundColor: COLORS.balance,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.balance
        },
        {
          label: translate('series.portfolio'),
          data: yearSeries.map((point) => point.portfolioCents / 100),
          backgroundColor: COLORS.portfolio,
          borderColor: COLORS.portfolio,
          pointBackgroundColor: COLORS.portfolio,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.portfolio
        },
        {
          label: translate('series.totalWealth'),
          data: yearSeries.map((point) => point.totalWealthCents / 100),
          backgroundColor: COLORS.totalWealth,
          borderColor: COLORS.totalWealth,
          pointBackgroundColor: COLORS.totalWealth,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.totalWealth
        }
      ]
    }),
    [yearSeries, yearSeriesVisibility, language, translate]
  );

  const yearChartOptions = useMemo<SeriesChartOptions>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: COLORS.tick, font: { size: X_TICK_FONT_SIZE } }
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: {
            color: COLORS.tick,
            callback: (value: string | number) => `${formatEuro(Number(value))} EUR`
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'bar'>) =>
              `${context.dataset.label}: ${formatEuro(context.parsed.y ?? 0)} EUR`
          }
        }
      },
      datasets: {
        bar: {
          barPercentage: 0.78,
          categoryPercentage: 0.68,
          maxBarThickness: 34
        }
      }
    }),
    []
  );

  const allYearsChartData = useMemo<SeriesChartData>(() => {
    const benefitColors = allYears.map((point) =>
      point.benefitCents < 0 ? COLORS.benefitNegative : COLORS.benefit
    );
    return {
      labels: allYears.map((point) => point.year),
      datasets: [
        {
          label: translate('series.income'),
          data: allYears.map((point) => point.incomeCents / 100),
          backgroundColor: COLORS.income,
          borderColor: COLORS.income,
          pointBackgroundColor: COLORS.income,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.income
        },
        {
          label: translate('series.expense'),
          data: allYears.map((point) => point.expenseCents / 100),
          backgroundColor: COLORS.expense,
          borderColor: COLORS.expense,
          pointBackgroundColor: COLORS.expense,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.expense
        },
        {
          label: translate('series.benefit'),
          data: allYears.map((point) => point.benefitCents / 100),
          backgroundColor: benefitColors,
          borderColor: benefitColors,
          pointBackgroundColor: benefitColors,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.benefit
        }
      ]
    };
  }, [allYears, allYearsSeriesVisibility, translate]);

  const allYearsWealthChartData = useMemo<SeriesChartData>(
    () => ({
      labels: allYears.map((point) => point.year),
      datasets: [
        {
          label: translate('series.balance'),
          data: allYears.map((point) => point.balanceCents / 100),
          backgroundColor: COLORS.balance,
          borderColor: COLORS.balance,
          pointBackgroundColor: COLORS.balance,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.balance
        },
        {
          label: translate('series.portfolio'),
          data: allYears.map((point) => point.portfolioCents / 100),
          backgroundColor: COLORS.portfolio,
          borderColor: COLORS.portfolio,
          pointBackgroundColor: COLORS.portfolio,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.portfolio
        },
        {
          label: translate('series.totalWealth'),
          data: allYears.map((point) => point.totalWealthCents / 100),
          backgroundColor: COLORS.totalWealth,
          borderColor: COLORS.totalWealth,
          pointBackgroundColor: COLORS.totalWealth,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.totalWealth
        }
      ]
    }),
    [allYears, allYearsSeriesVisibility, translate]
  );

  const allYearsChartOptions = useMemo<SeriesChartOptions>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: COLORS.tick, font: { size: X_TICK_FONT_SIZE } }
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: {
            color: COLORS.tick,
            callback: (value: string | number) => `${formatEuro(Number(value))} EUR`
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'bar'>) =>
              `${context.dataset.label}: ${formatEuro(context.parsed.y ?? 0)} EUR`
          }
        }
      },
      datasets: {
        bar: {
          categoryPercentage: 0.58,
          barPercentage: 0.76,
          maxBarThickness: 34
        }
      }
    }),
    []
  );

  return {
    yearChartData,
    yearWealthChartData,
    yearChartOptions,
    allYearsChartData,
    allYearsWealthChartData,
    allYearsChartOptions
  };
}
