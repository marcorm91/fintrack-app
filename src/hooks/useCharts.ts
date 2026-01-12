import { useCallback, useMemo } from 'react';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import type { ChartType, SeriesKey } from '../types';
import type { MonthlySeriesPoint, MonthlySummary } from '../db';
import type { AllYearsPoint } from './useSeriesDerived';
import { COLORS, X_TICK_FONT_SIZE } from '../constants';
import { getMonthLabel } from '../utils/date';
import { formatEuro } from '../utils/format';

type UseChartsOptions = {
  language: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  displaySummary: MonthlySummary;
  monthSeriesVisibility: Record<SeriesKey, boolean>;
  monthChartType: ChartType;
  yearSeriesVisibility: Record<SeriesKey, boolean>;
  yearChartType: ChartType;
  allYearsSeriesVisibility: Record<SeriesKey, boolean>;
  allYearsChartType: ChartType;
  yearSeries: MonthlySeriesPoint[];
  allYears: AllYearsPoint[];
};

type SeriesChartData = ChartData<'bar' | 'line', Array<number | null>, string>;
type SeriesChartOptions = ChartOptions<'bar' | 'line'>;

export function useCharts({
  language,
  t,
  displaySummary,
  monthSeriesVisibility,
  monthChartType,
  yearSeriesVisibility,
  yearChartType,
  allYearsSeriesVisibility,
  allYearsChartType,
  yearSeries,
  allYears
}: UseChartsOptions) {
  const translate = useCallback(
    (key: string, options?: Record<string, unknown>) => t(key, { ...options, lng: language }),
    [language, t]
  );
  const isMonthLine = monthChartType === 'line';
  const isYearLine = yearChartType === 'line';
  const isAllYearsLine = allYearsChartType === 'line';
  const hasVisibleMonthBars =
    monthSeriesVisibility.income || monthSeriesVisibility.expense || monthSeriesVisibility.balance;
  const showMonthBenefit = monthSeriesVisibility.benefit;

  const monthChartData = useMemo<SeriesChartData>(() => {
    const monthBarColors = [COLORS.income, COLORS.expense, COLORS.balance];
    return {
      labels: [translate('series.income'), translate('series.expense'), translate('series.balance')],
      datasets: [
        {
          label: translate('labels.summary'),
          data: [
            monthSeriesVisibility.income ? displaySummary.incomeCents / 100 : null,
            monthSeriesVisibility.expense ? displaySummary.expenseCents / 100 : null,
            monthSeriesVisibility.balance ? displaySummary.balanceCents / 100 : null
          ],
          backgroundColor: monthBarColors,
          borderColor: COLORS.balance,
          pointBackgroundColor: monthBarColors,
          borderWidth: isMonthLine ? 2 : 0,
          fill: false,
          borderRadius: 6
        }
      ]
    };
  }, [displaySummary, monthSeriesVisibility, isMonthLine, translate]);

  const monthChartOptions = useMemo<SeriesChartOptions>(
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
            label: (context: TooltipItem<'bar' | 'line'>) =>
              `${context.label}: ${formatEuro(context.parsed.y)} EUR`
          }
        }
      },
      elements: {
        line: { tension: 0.35, borderWidth: 2 },
        point: { radius: isMonthLine ? 3 : 0, hoverRadius: isMonthLine ? 4 : 0 }
      }
    }),
    [isMonthLine]
  );

  const benefitChartData = useMemo<SeriesChartData>(() => {
    const benefitColor = displaySummary.benefitCents < 0 ? COLORS.benefitNegative : COLORS.benefit;
    const benefitValue = Math.abs(displaySummary.benefitCents / 100);
    return {
      labels: [translate('series.benefit')],
      datasets: [
        {
          label: translate('series.benefit'),
          data: [benefitValue],
          backgroundColor: benefitColor,
          borderColor: benefitColor,
          pointBackgroundColor: benefitColor,
          borderWidth: isMonthLine ? 2 : 0,
          fill: false,
          borderRadius: 6
        }
      ]
    };
  }, [displaySummary, isMonthLine, translate]);

  const benefitChartOptions = useMemo<SeriesChartOptions>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { display: false }
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: {
            color: COLORS.tick,
            callback: (value: string | number) => {
              const sign = displaySummary.benefitCents < 0 ? -1 : 1;
              return `${formatEuro(sign * Number(value))} EUR`;
            }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: () =>
              translate('tooltips.benefit', { value: formatEuro(displaySummary.benefitCents / 100) })
          }
        }
      },
      elements: {
        line: { tension: 0.35, borderWidth: 2 },
        point: { radius: isMonthLine ? 3 : 0, hoverRadius: isMonthLine ? 4 : 0 }
      }
    }),
    [displaySummary, isMonthLine, translate]
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
          borderWidth: isYearLine ? 2 : 0,
          fill: false,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.income
        },
        {
          label: translate('series.expense'),
          data: yearSeries.map((point) => point.expenseCents / 100),
          backgroundColor: COLORS.expense,
          borderColor: COLORS.expense,
          pointBackgroundColor: COLORS.expense,
          borderWidth: isYearLine ? 2 : 0,
          fill: false,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.expense
        },
        {
          label: translate('series.balance'),
          data: yearSeries.map((point) => point.balanceCents / 100),
          backgroundColor: COLORS.balance,
          borderColor: COLORS.balance,
          pointBackgroundColor: COLORS.balance,
          borderWidth: isYearLine ? 2 : 0,
          fill: false,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.balance
        },
        {
          label: translate('series.benefit'),
          data: yearSeries.map((point) => point.benefitCents / 100),
          backgroundColor: benefitColors,
          borderColor: benefitColors,
          pointBackgroundColor: benefitColors,
          borderWidth: isYearLine ? 2 : 0,
          fill: false,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.benefit
        }
      ]
    };
  }, [yearSeries, yearSeriesVisibility, isYearLine, language, translate]);

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
            label: (context: TooltipItem<'bar' | 'line'>) =>
              `${context.dataset.label}: ${formatEuro(context.parsed.y)} EUR`
          }
        }
      },
      datasets: {
        bar: {
          barPercentage: 1,
          categoryPercentage: 1
        }
      },
      elements: {
        line: { tension: 0.35, borderWidth: 2 },
        point: { radius: isYearLine ? 3 : 0, hoverRadius: isYearLine ? 4 : 0 }
      }
    }),
    [isYearLine]
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
          borderWidth: isAllYearsLine ? 2 : 0,
          fill: false,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.income
        },
        {
          label: translate('series.expense'),
          data: allYears.map((point) => point.expenseCents / 100),
          backgroundColor: COLORS.expense,
          borderColor: COLORS.expense,
          pointBackgroundColor: COLORS.expense,
          borderWidth: isAllYearsLine ? 2 : 0,
          fill: false,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.expense
        },
        {
          label: translate('series.balance'),
          data: allYears.map((point) => point.balanceCents / 100),
          backgroundColor: COLORS.balance,
          borderColor: COLORS.balance,
          pointBackgroundColor: COLORS.balance,
          borderWidth: isAllYearsLine ? 2 : 0,
          fill: false,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.balance
        },
        {
          label: translate('series.benefit'),
          data: allYears.map((point) => point.benefitCents / 100),
          backgroundColor: benefitColors,
          borderColor: benefitColors,
          pointBackgroundColor: benefitColors,
          borderWidth: isAllYearsLine ? 2 : 0,
          fill: false,
          borderRadius: 4,
          hidden: !allYearsSeriesVisibility.benefit
        }
      ]
    };
  }, [allYears, allYearsSeriesVisibility, isAllYearsLine, translate]);

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
            label: (context: TooltipItem<'bar' | 'line'>) =>
              `${context.dataset.label}: ${formatEuro(context.parsed.y)} EUR`
          }
        }
      },
      datasets: {
        bar: {
          categoryPercentage: 0.65,
          barPercentage: 0.8
        }
      },
      elements: {
        line: { tension: 0.35, borderWidth: 2 },
        point: { radius: isAllYearsLine ? 3 : 0, hoverRadius: isAllYearsLine ? 4 : 0 }
      }
    }),
    [isAllYearsLine]
  );

  return {
    monthChartData,
    monthChartOptions,
    benefitChartData,
    benefitChartOptions,
    yearChartData,
    yearChartOptions,
    allYearsChartData,
    allYearsChartOptions,
    isMonthLine,
    isYearLine,
    isAllYearsLine,
    hasVisibleMonthBars,
    showMonthBenefit
  };
}
