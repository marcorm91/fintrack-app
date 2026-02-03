import { useMemo, useState } from 'react';
import type { BalanceTrend, ChartType, SeriesKey, SortDirection, YearTableSortKey } from '../../types';
import type { MonthlySeriesPoint } from '../../db';
import type { ActiveElement, ChartData, ChartEvent, ChartOptions } from 'chart.js';
import type { RefObject } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { ChartTypeToggle } from '../../components/ChartTypeToggle';
import { ChartModal } from '../../components/ChartModal';
import { EyeToggle } from '../../components/EyeToggle';
import { InsightsPanel } from '../../components/InsightsPanel';
import { SortIndicator } from '../../components/SortIndicator';
import { ChevronIcon, TrendIcon } from '../../components/icons';
import { useChartResize, type ChartInstance } from '../../hooks/useChartResize';
import { useIsMobile } from '../../hooks/useIsMobile';
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
  const isMobile = useIsMobile();
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const { chartRef: yearChartRef, containerRef: yearChartContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const { chartRef: yearChartModalRef, containerRef: yearChartModalContainerRef } = useChartResize<
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
  const compactYearChartOptions: SeriesChartOptions = isMobile
    ? {
        ...yearChartOptionsWithClick,
        scales: {
          ...yearChartOptionsWithClick.scales,
          x: {
            ...(yearChartOptionsWithClick.scales?.x ?? {}),
            ticks: {
              ...((yearChartOptionsWithClick.scales?.x as { ticks?: unknown })?.ticks ?? {}),
              autoSkip: true,
              maxTicksLimit: 6
            }
          },
          y: {
            ...(yearChartOptionsWithClick.scales?.y ?? {}),
            ticks: {
              ...((yearChartOptionsWithClick.scales?.y as { ticks?: unknown })?.ticks ?? {}),
              maxTicksLimit: 5
            }
          }
        }
      }
    : yearChartOptionsWithClick;
  const yearChartModalMinWidth = Math.max(360, sortedYearSeries.length * 56);
  return (
    <>
      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6" open>
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-accent2 list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.28em]">
          <span>{t('labels.yearChart')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-4">
          <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-wrap items-start justify-between'}`}>
            <div>
              <h2 className="text-xl font-semibold text-ink sm:text-2xl">{yearValue}</h2>
            </div>
            {isMobile ? (
              <div className="grid w-full gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setYearValue((prev) => shiftYearValue(prev, -1))}
                    aria-label={t('actions.previousYear')}
                    title={t('actions.previousYear')}
                    className={`flex items-center justify-center rounded-full border border-ink/10 bg-white text-muted shadow-sm transition hover:border-accent hover:text-ink ${
                      isMobile ? 'h-8 w-8 p-0' : 'p-1'
                    }`}
                  >
                    <ChevronIcon direction="left" />
                  </button>
                  <div className="flex-1 text-sm text-muted">
                    <select
                      id="year"
                      value={yearValue}
                      onChange={(event) => setYearValue(event.target.value)}
                      className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-center text-[11px] leading-4 text-ink shadow-sm focus:border-accent focus:outline-none sm:px-4 sm:text-sm"
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
                    className={`flex items-center justify-center rounded-full border border-ink/10 bg-white text-muted shadow-sm transition hover:border-accent hover:text-ink ${
                      isMobile ? 'h-8 w-8 p-0' : 'p-1'
                    }`}
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setYearValue(currentYearValue)}
                  disabled={isCurrentYear}
                  className={`w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition ${
                    isCurrentYear ? 'cursor-default opacity-60' : ' hover:border-accent hover:text-ink'
                  }`}
                >
                  {t('actions.gotoCurrentYear')}
                </button>
              </div>
            ) : (
              <>
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
                        className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-base text-ink shadow-sm focus:border-accent focus:outline-none sm:px-4 sm:text-sm"
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
                    className={`rounded-xl border border-ink/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition sm:text-[11px] sm:tracking-[0.18em] ${
                      isCurrentYear
                        ? 'cursor-default opacity-60'
                        : ' hover:border-accent hover:text-ink'
                    }`}
                  >
                    {t('actions.gotoCurrentYear')}
                  </button>
                </div>
                <div aria-hidden="true"></div>
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-muted sm:text-xs">
            {BAR_TYPES.map((item) => (
              <span key={item.key} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-sm ${item.colorClass}`} />
                {t(item.labelKey)}
              </span>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
            <div className="rounded-xl border border-ink/10 bg-white/90 p-3 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>{t('labels.totalIncome')}</span>
                <EyeToggle
                  hidden={!yearSeriesVisibility.income}
                  onClick={() => toggleYearSeries('income')}
                  label={t('series.income')}
                />
              </div>
              <div className="mt-2 font-semibold flex items-center gap-2 text-base text-ink sm:text-lg">
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
              <div className="mt-2 font-semibold flex items-center gap-2 text-base text-ink sm:text-lg">
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
              <div className={`mt-2 font-semibold flex items-center gap-2 text-base sm:text-lg ${getBenefitClass(yearTotals.benefitCents)}`}>
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
              <div className="mt-2 font-semibold flex items-center gap-2 text-base text-ink sm:text-lg">
                <span className="h-2.5 w-2.5 rounded-full bg-balance" />
                <span>{formatCents(yearTotals.balanceCents)} EUR</span>
              </div>
            </div>
          </div>
          {bestBenefitMonth && yearSeriesVisibility.benefit ? (
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                <TrendIcon trend="up" />
                <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                  {t('labels.bestBenefitMonth', {
                    month: getMonthLabel(bestBenefitMonth.month, locale, 'long')
                  })}
                  <span className="flex items-center gap-1 font-semibold text-benefit whitespace-nowrap">
                    <TrendIcon trend="right" />
                    {formatCents(bestBenefitMonth.benefitCents)} EUR
                  </span>
                </span>
              </li>
              {worstBenefitMonth && worstBenefitMonth.month !== bestBenefitMonth.month ? (
                <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                  <TrendIcon trend="down" />
                  <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                    {t('labels.worstBenefitMonth', {
                      month: getMonthLabel(worstBenefitMonth.month, locale, 'long')
                    })}
                    <span className="flex items-center gap-1 font-semibold text-benefitNegative whitespace-nowrap">
                      <TrendIcon trend="right" />
                      {formatCents(worstBenefitMonth.benefitCents)} EUR
                    </span>
                  </span>
                </li>
              ) : null}
            </ul>
          ) : null}
          <div className="mt-5 rounded-2xl border border-ink/10 bg-white/90 p-3 sm:mt-6 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
                {t('labels.yearChart')}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <ChartTypeToggle value={yearChartType} onChange={setYearChartType} />
                {isMobile ? (
                  <button
                    type="button"
                    onClick={() => setChartModalOpen(true)}
                    className="rounded-full border border-ink/10 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
                  >
                    {t('actions.viewLarge')}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-4">
              {!hasChartData ? (
                <p className="text-sm text-muted">{t('messages.noChartData')}</p>
              ) : (
                <div className="h-[160px] sm:h-[320px]" ref={yearChartContainerRef}>
                  {isYearLine ? (
                    <Line
                      data={yearChartData as ChartData<'line', Array<number | null>, string>}
                      options={compactYearChartOptions as ChartOptions<'line'>}
                      ref={yearChartRef as RefObject<ChartInstance<'line', Array<number | null>, unknown>>}
                    />
                  ) : (
                    <Bar
                      data={yearChartData as ChartData<'bar', Array<number | null>, string>}
                      options={compactYearChartOptions as ChartOptions<'bar'>}
                      ref={yearChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </details>

      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-muted list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.2em]">
          <span>{t('labels.monthDetail')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-4 flex items-center justify-end">
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
            {yearValue}
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs sm:text-sm">
            <thead className="text-[10px] uppercase tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.14em]">
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
                      <td className="py-3 pr-4 text-muted">{getMonthLabel(point.month, locale, 'long')}</td>
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
      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-muted list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.2em]">
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
            currentLabel={yearInsights.currentLabel}
            previousLabel={yearInsights.previousLabel}
            hasAnyData={yearInsights.hasAnyData}
            showTitle={false}
            containerClassName="rounded-none border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </details>
      <ChartModal
        open={chartModalOpen}
        title={t('labels.yearChart')}
        closeLabel={t('actions.close')}
        onClose={() => setChartModalOpen(false)}
        fullScreen={isMobile}
        requestLandscape={isMobile}
        rotateHint={t('messages.rotateDevice')}
      >
        <div className="h-full w-full overflow-x-auto">
          <div className="h-full" style={{ minWidth: `${yearChartModalMinWidth}px` }} ref={yearChartModalContainerRef}>
            {hasChartData ? (
              isYearLine ? (
                <Line
                  data={yearChartData as ChartData<'line', Array<number | null>, string>}
                  options={yearChartOptionsWithClick as ChartOptions<'line'>}
                  ref={yearChartModalRef as RefObject<ChartInstance<'line', Array<number | null>, unknown>>}
                />
              ) : (
                <Bar
                  data={yearChartData as ChartData<'bar', Array<number | null>, string>}
                  options={yearChartOptionsWithClick as ChartOptions<'bar'>}
                  ref={yearChartModalRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                {t('messages.noChartData')}
              </div>
            )}
          </div>
        </div>
      </ChartModal>
    </>
  );
}
