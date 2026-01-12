import { useMemo } from 'react';
import type { BalanceTrend, ChartType, SeriesKey, SortDirection, YearTableSortKey } from '../../types';
import type { MonthlySeriesPoint } from '../../db';
import type { ActiveElement, ChartData, ChartEvent, ChartOptions } from 'chart.js';
import type { RefObject } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { ChartTypeToggle } from '../../components/ChartTypeToggle';
import { EyeToggle } from '../../components/EyeToggle';
import { InsightsPanel } from '../../components/InsightsPanel';
import { SortIndicator } from '../../components/SortIndicator';
import { ChevronIcon, TrendIcon } from '../../components/icons';
import { useChartResize, type ChartInstance } from '../../hooks/useChartResize';
import { BAR_TYPES } from '../../constants';
import { formatCents, getBenefitClass } from '../../utils/format';
import { getMonthLabel, shiftYearValue } from '../../utils/date';
import type { InsightsPayload } from '../../types/insights';

type YearTotals = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  benefitCents: number;
};

type SeriesChartData = ChartData<'bar' | 'line', Array<number | null>, string>;
type SeriesChartOptions = ChartOptions<'bar' | 'line'>;

type YearViewProps = {
  yearValue: string;
  setYearValue: (value: string | ((prev: string) => string)) => void;
  currentYearValue: string;
  isCurrentYear: boolean;
  availableYears: string[];
  yearTotals: YearTotals;
  yearBenefitDotClass: string;
  yearSeriesVisibility: Record<SeriesKey, boolean>;
  toggleYearSeries: (key: SeriesKey) => void;
  showOnlyYearSeries: (key: SeriesKey) => void;
  yearChartType: ChartType;
  setYearChartType: (value: ChartType) => void;
  hasChartData: boolean;
  yearChartData: SeriesChartData;
  yearChartOptions: SeriesChartOptions;
  sortedYearSeries: MonthlySeriesPoint[];
  yearTableSort: { key: YearTableSortKey; direction: SortDirection };
  handleYearSort: (key: YearTableSortKey) => void;
  yearTrendByMonth: Map<string, BalanceTrend>;
  isYearLine: boolean;
  yearInsights: InsightsPayload;
};

export function YearView({
  yearValue,
  setYearValue,
  currentYearValue,
  isCurrentYear,
  availableYears,
  yearTotals,
  yearBenefitDotClass,
  yearSeriesVisibility,
  toggleYearSeries,
  showOnlyYearSeries,
  yearChartType,
  setYearChartType,
  hasChartData,
  yearChartData,
  yearChartOptions,
  sortedYearSeries,
  yearTableSort,
  handleYearSort,
  yearTrendByMonth,
  isYearLine,
  yearInsights
}: YearViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { chartRef: yearChartRef, containerRef: yearChartContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const { bestBenefitMonth, worstBenefitMonth } = useMemo(() => {
    if (sortedYearSeries.length === 0) {
      return { bestBenefitMonth: null, worstBenefitMonth: null };
    }
    let best: MonthlySeriesPoint = sortedYearSeries[0];
    let worst: MonthlySeriesPoint = sortedYearSeries[0];
    for (const point of sortedYearSeries) {
      if (point.benefitCents > best.benefitCents) {
        best = point;
      }
      if (point.benefitCents < worst.benefitCents) {
        worst = point;
      }
    }
    return { bestBenefitMonth: best, worstBenefitMonth: worst };
  }, [sortedYearSeries]);
  const visibleColumns =
    1 +
    Number(yearSeriesVisibility.income) +
    Number(yearSeriesVisibility.expense) +
    Number(yearSeriesVisibility.balance) +
    Number(yearSeriesVisibility.benefit);
  const handleYearChartClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    const element = elements[0];
    if (!element) {
      return;
    }
    const seriesKey = BAR_TYPES[element.datasetIndex]?.key;
    if (!seriesKey) {
      return;
    }
    showOnlyYearSeries(seriesKey);
  };
  const yearChartOptionsWithClick: SeriesChartOptions = {
    ...yearChartOptions,
    onClick: handleYearChartClick
  };
  return (
    <>
      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-6 shadow-card" open>
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs uppercase tracking-[0.28em] text-accent2 list-none [&::-webkit-details-marker]:hidden">
          <span>{t('labels.yearChart')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">{yearValue}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setYearValue((prev) => shiftYearValue(prev, -1))}
                  aria-label={t('actions.previousYear')}
                  title={t('actions.previousYear')}
                  className="rounded-full border border-ink/10 bg-white p-1 text-muted shadow-sm transition hover:border-accent hover:text-ink"
                >
                  <ChevronIcon direction="left" />
                </button>
                <div className="text-sm text-muted">
                  <select
                    id="year"
                    value={yearValue}
                    onChange={(event) => setYearValue(event.target.value)}
                    className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setYearValue((prev) => shiftYearValue(prev, 1))}
                  aria-label={t('actions.nextYear')}
                  title={t('actions.nextYear')}
                  className="rounded-full border border-ink/10 bg-white p-1 text-muted shadow-sm transition hover:border-accent hover:text-ink"
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setYearValue(currentYearValue)}
                disabled={isCurrentYear}
                className={`rounded-xl border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition ${
                  isCurrentYear
                    ? 'cursor-default opacity-60'
                    : ' hover:border-accent hover:text-ink'
                }`}
              >
                {t('actions.gotoCurrentYear')}
              </button>
            </div>
            <div aria-hidden="true">
              
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
            {BAR_TYPES.map((item) => (
              <span key={item.key} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-sm ${item.colorClass}`} />
                {t(item.labelKey)}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-ink/10 bg-white/90 p-3 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>{t('labels.totalIncome')}</span>
                <EyeToggle
                  hidden={!yearSeriesVisibility.income}
                  onClick={() => toggleYearSeries('income')}
                  label={t('series.income')}
                />
              </div>
              <div className="mt-2 font-semibold flex items-center gap-2 text-lg text-ink">
                <span className="h-2.5 w-2.5 rounded-full bg-income" />
                <span>{formatCents(yearTotals.incomeCents)} EUR</span>
              </div>
            </div>
            <div className="rounded-xl border border-ink/10 bg-white/90 p-3 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>{t('labels.totalExpense')}</span>
                <EyeToggle
                  hidden={!yearSeriesVisibility.expense}
                  onClick={() => toggleYearSeries('expense')}
                  label={t('series.expense')}
                />
              </div>
              <div className="mt-2 font-semibold flex items-center gap-2 text-lg text-ink">
                <span className="h-2.5 w-2.5 rounded-full bg-expense" />
                <span>{formatCents(yearTotals.expenseCents)} EUR</span>
              </div>
            </div>
            <div className="rounded-xl border border-ink/10 bg-white/90 p-3 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>{t('labels.totalBenefit')}</span>
                <EyeToggle
                  hidden={!yearSeriesVisibility.benefit}
                  onClick={() => toggleYearSeries('benefit')}
                  label={t('series.benefit')}
                />
              </div>
              <div className={`mt-2 font-semibold flex items-center gap-2 text-lg ${getBenefitClass(yearTotals.benefitCents)}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${yearBenefitDotClass}`} />
                <span>{formatCents(yearTotals.benefitCents)} EUR</span>
              </div>
            </div>
            <div className="rounded-xl border border-ink/10 bg-white/90 p-3 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>{t('labels.finalBalance')}</span>
                <EyeToggle
                  hidden={!yearSeriesVisibility.balance}
                  onClick={() => toggleYearSeries('balance')}
                  label={t('series.balance')}
                />
              </div>
              <div className="mt-2 font-semibold flex items-center gap-2 text-lg text-ink">
                <span className="h-2.5 w-2.5 rounded-full bg-balance" />
                <span>{formatCents(yearTotals.balanceCents)} EUR</span>
              </div>
            </div>
          </div>
          {bestBenefitMonth && yearSeriesVisibility.benefit ? (
            <ul className="mt-4 list-disc pl-5 text-sm text-muted">
              <li className="font-medium text-ink">
                {t('labels.bestBenefitMonth', {
                  month: getMonthLabel(bestBenefitMonth.month, locale),
                  value: formatCents(bestBenefitMonth.benefitCents)
                })}
              </li>
              {worstBenefitMonth && worstBenefitMonth.month !== bestBenefitMonth.month ? (
                <li className="text-ink">
                  {t('labels.worstBenefitMonth', {
                    month: getMonthLabel(worstBenefitMonth.month, locale),
                    value: formatCents(worstBenefitMonth.benefitCents)
                  })}
                </li>
              ) : null}
            </ul>
          ) : null}
          <div className="mt-6 rounded-2xl border border-ink/10 bg-white/90 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">{t('labels.yearChart')}</p>
              <ChartTypeToggle value={yearChartType} onChange={setYearChartType} />
            </div>
            <div className="mt-4">
              {!hasChartData ? (
                <p className="text-sm text-muted">{t('messages.noChartData')}</p>
              ) : (
                <div className="h-[320px]" ref={yearChartContainerRef}>
                  {isYearLine ? (
                    <Line
                      data={yearChartData as ChartData<'line', Array<number | null>, string>}
                      options={yearChartOptionsWithClick as ChartOptions<'line'>}
                      ref={yearChartRef as RefObject<ChartInstance<'line', Array<number | null>, unknown>>}
                    />
                  ) : (
                    <Bar
                      data={yearChartData as ChartData<'bar', Array<number | null>, string>}
                      options={yearChartOptionsWithClick as ChartOptions<'bar'>}
                      ref={yearChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </details>

      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-6 shadow-card">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-muted list-none [&::-webkit-details-marker]:hidden">
          <span>{t('labels.monthDetail')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-4 flex items-center justify-end">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">{yearValue}</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted">
              <tr className="border-b border-ink/10">
                <th className="py-3 pr-4">
                  <button
                    type="button"
                    onClick={() => handleYearSort('month')}
                    className="inline-flex items-center gap-1"
                  >
                    {t('labels.month')}
                    <SortIndicator active={yearTableSort.key === 'month'} direction={yearTableSort.direction} />
                  </button>
                </th>
                {yearSeriesVisibility.income ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleYearSort('income')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.income')}
                      <SortIndicator
                        active={yearTableSort.key === 'income'}
                        direction={yearTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {yearSeriesVisibility.expense ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleYearSort('expense')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.expense')}
                      <SortIndicator
                        active={yearTableSort.key === 'expense'}
                        direction={yearTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {yearSeriesVisibility.balance ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleYearSort('balance')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.balance')}
                      <SortIndicator
                        active={yearTableSort.key === 'balance'}
                        direction={yearTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {yearSeriesVisibility.benefit ? (
                  <th className="py-3">
                    <button
                      type="button"
                      onClick={() => handleYearSort('benefit')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.benefit')}
                      <SortIndicator
                        active={yearTableSort.key === 'benefit'}
                        direction={yearTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {!hasChartData ? (
                <tr>
                  <td colSpan={visibleColumns} className="py-6 text-center text-sm text-muted">
                    {t('messages.noTableData')}
                  </td>
                </tr>
              ) : (
                sortedYearSeries.map((point) => {
                  const trend = yearTrendByMonth.get(point.month) ?? 'flat';
                  return (
                    <tr key={point.month} className="border-b border-ink/5">
                      <td className="py-3 pr-4 text-muted">{getMonthLabel(point.month, locale)}</td>
                      {yearSeriesVisibility.income ? (
                        <td className="py-3 pr-4 text-ink">{formatCents(point.incomeCents)} EUR</td>
                      ) : null}
                      {yearSeriesVisibility.expense ? (
                        <td className="py-3 pr-4 text-ink">{formatCents(point.expenseCents)} EUR</td>
                      ) : null}
                      {yearSeriesVisibility.balance ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.balanceCents)} EUR</span>
                            <TrendIcon trend={trend} />
                          </div>
                        </td>
                      ) : null}
                      {yearSeriesVisibility.benefit ? (
                        <td className={`py-3 ${getBenefitClass(point.benefitCents)}`}>
                          {formatCents(point.benefitCents)} EUR
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </details>
      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-6 shadow-card">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-muted list-none [&::-webkit-details-marker]:hidden">
          <span>{t('insights.title')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-4">
          <InsightsPanel
            title={yearInsights.title}
            comparisons={yearInsights.comparisons}
            emptyLabel={yearInsights.emptyLabel}
            hasAnyData={yearInsights.hasAnyData}
            showTitle={false}
            containerClassName="rounded-none border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </details>
    </>
  );
}
