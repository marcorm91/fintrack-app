import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SeriesKey, SeriesTrendMap, SortDirection, YearTableSortKey } from '../../types';
import type { MonthlySeriesPoint } from '../../db';
import type { ChartData, ChartOptions } from 'chart.js';
import type { RefObject } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { ChartModal } from '../../components/ChartModal';
import { InfoDialog } from '../../components/Dialogs';
import { EyeToggle } from '../../components/EyeToggle';
import { InsightsPanel } from '../../components/InsightsPanel';
import { SeriesBullet } from '../../components/SeriesBullet';
import { SortIndicator } from '../../components/SortIndicator';
import { ChevronIcon, NoteIcon, TrendIcon } from '../../components/icons';
import { useChartResize, type ChartInstance } from '../../hooks/useChartResize';
import { useChartInteractionOptions } from '../../hooks/useChartInteractionOptions';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { FLOW_TYPES, WEALTH_TYPES } from '../../constants';
import { formatCents, getBenefitClass } from '../../utils/format';
import { getMonthLabel, shiftYearValue } from '../../utils/date';
import type { InsightsPayload } from '../../types/insights';
import '../../utils/chartSetup';
import { findBenefitExtremes } from '../../utils/metrics';

type YearTotals = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  benefitCents: number;
};

type SeriesChartData = ChartData<'bar', Array<number | null>, string>;
type SeriesChartOptions = ChartOptions<'bar'>;

type YearViewProps = {
  yearValue: string;
  setYearValue: (value: string | ((prev: string) => string)) => void;
  currentYearValue: string;
  isCurrentYear: boolean;
  availableYears: string[];
  comparisonYears: string[];
  yearComparisonValue: string;
  setYearComparisonValue: (value: string) => void;
  yearTotals: YearTotals;
  yearSeriesVisibility: Record<SeriesKey, boolean>;
  toggleYearSeries: (key: SeriesKey) => void;
  showOnlyYearSeries: (key: SeriesKey) => void;
  hasInvestmentPortfolio: boolean;
  hasChartData: boolean;
  yearChartData: SeriesChartData;
  yearWealthChartData: SeriesChartData;
  yearChartOptions: SeriesChartOptions;
  sortedYearSeries: MonthlySeriesPoint[];
  yearTableSort: { key: YearTableSortKey; direction: SortDirection };
  handleYearSort: (key: YearTableSortKey) => void;
  yearTrendByMonth: Map<string, SeriesTrendMap>;
  yearInsights: InsightsPayload;
};

export function YearView({
  yearValue,
  setYearValue,
  currentYearValue,
  isCurrentYear,
  availableYears,
  comparisonYears,
  yearComparisonValue,
  setYearComparisonValue,
  yearTotals,
  yearSeriesVisibility,
  toggleYearSeries,
  showOnlyYearSeries,
  hasInvestmentPortfolio,
  hasChartData,
  yearChartData,
  yearWealthChartData,
  yearChartOptions,
  sortedYearSeries,
  yearTableSort,
  handleYearSort,
  yearTrendByMonth,
  yearInsights
}: YearViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const isMobile = useIsMobile();
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [activeChartPanel, setActiveChartPanel] = useState<'summary' | 'wealth'>('summary');
  const [selectedNote, setSelectedNote] = useState<{ month: string; note: string } | null>(null);
  const { chartRef: yearChartRef, containerRef: yearChartContainerRef } = useChartResize<
    'bar',
    Array<number | null>,
    string
  >();
  const { chartRef: yearChartModalRef, containerRef: yearChartModalContainerRef } = useChartResize<
    'bar',
    Array<number | null>,
    string
  >();
  const { chartRef: yearWealthChartRef, containerRef: yearWealthChartContainerRef } = useChartResize<
    'bar',
    Array<number | null>,
    string
  >();
  const { best: bestBenefitMonth, worst: worstBenefitMonth } = useMemo(
    () => findBenefitExtremes(sortedYearSeries),
    [sortedYearSeries]
  );
  const activeChartTitle =
    activeChartPanel === 'summary' ? t('labels.cashFlowChart') : t('labels.wealthChart');
  const activeYearChartModalTitle = `${activeChartTitle} ${yearValue}`;
  const visibleColumns =
    1 +
    Number(yearSeriesVisibility.income) +
    Number(yearSeriesVisibility.expense) +
    Number(yearSeriesVisibility.benefit) +
    Number(yearSeriesVisibility.balance) +
    Number(yearSeriesVisibility.portfolio) +
    Number(yearSeriesVisibility.totalWealth);
  useEffect(() => {
    if (yearComparisonValue && !comparisonYears.includes(yearComparisonValue)) {
      setYearComparisonValue('');
    }
  }, [comparisonYears, setYearComparisonValue, yearComparisonValue]);
  const openChartModal = useCallback(() => setChartModalOpen(true), []);
  const {
    interactiveOptions: yearChartOptionsWithClick,
    compactOptions: compactYearChartOptions
  } = useChartInteractionOptions({
    options: yearChartOptions,
    series: FLOW_TYPES,
    isMobile,
    onShowOnly: showOnlyYearSeries,
    onOpenModal: openChartModal
  });
  const {
    interactiveOptions: yearWealthChartOptionsWithClick,
    compactOptions: compactYearWealthChartOptions
  } = useChartInteractionOptions({
    options: yearChartOptions,
    series: WEALTH_TYPES,
    isMobile,
    onShowOnly: showOnlyYearSeries,
    onOpenModal: openChartModal
  });
  const handleYearSwipe = useCallback(
    (direction: 'next' | 'previous') => {
      setYearValue((prev) => shiftYearValue(prev, direction === 'next' ? 1 : -1));
    },
    [setYearValue]
  );
  const { motionClassName, swipeHandlers } = useSwipeNavigation({
    enabled: isMobile,
    blocked: chartModalOpen,
    onSwipe: handleYearSwipe
  });
  const yearChartModalMinWidth = Math.max(360, sortedYearSeries.length * 56);
  return (
    <div
      className="min-w-0 overflow-x-hidden"
      {...swipeHandlers}
    >
      <div
        className={`grid min-w-0 gap-4 overflow-x-hidden transition duration-150 ease-out sm:gap-6 ${motionClassName}`}
      >
        <details className="group min-w-0 rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6" open>
          <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-accent2 list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.28em]">
            <span>{t('labels.yearChart')}</span>
            <span className="text-muted transition group-open:rotate-90">
              <ChevronIcon direction="right" />
            </span>
          </summary>
          <div className="mt-2">
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
                    className={`btn btn-neutral text-muted hover:text-ink ${isMobile ? 'btn-icon' : 'btn-icon-sm'}`}
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
                    className={`btn btn-neutral text-muted hover:text-ink ${isMobile ? 'btn-icon' : 'btn-icon-sm'}`}
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setYearValue(currentYearValue)}
                  disabled={isCurrentYear}
                  className={`btn btn-neutral w-full px-3 text-[9px] ${
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
                      className="btn btn-neutral btn-icon-sm text-muted hover:text-ink"
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
                      className="btn btn-neutral btn-icon-sm text-muted hover:text-ink"
                    >
                      <ChevronIcon direction="right" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setYearValue(currentYearValue)}
                    disabled={isCurrentYear}
                    className={`btn btn-neutral ${
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
          <div className="mt-5 grid gap-5 sm:mt-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
                {t('labels.cashFlow')}
              </p>
              <div className={`mt-3 grid grid-cols-2 gap-2 sm:gap-4 ${hasInvestmentPortfolio ? 'sm:grid-cols-3' : ''}`}>
                <div className="metric-card">
                  <div className="flex items-center justify-between">
                    <span>{t('labels.totalIncome')}</span>
                    <EyeToggle
                      hidden={!yearSeriesVisibility.income}
                      onClick={() => toggleYearSeries('income')}
                      label={t('series.income')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                    <SeriesBullet seriesKey="income" />
                    <span className="min-w-0 break-words">{formatCents(yearTotals.incomeCents)} EUR</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="flex items-center justify-between">
                    <span>{t('labels.totalExpense')}</span>
                    <EyeToggle
                      hidden={!yearSeriesVisibility.expense}
                      onClick={() => toggleYearSeries('expense')}
                      label={t('series.expense')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                    <SeriesBullet seriesKey="expense" />
                    <span className="min-w-0 break-words">{formatCents(yearTotals.expenseCents)} EUR</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="flex items-center justify-between">
                    <span>{t('labels.totalBenefit')}</span>
                    <EyeToggle
                      hidden={!yearSeriesVisibility.benefit}
                      onClick={() => toggleYearSeries('benefit')}
                      label={t('series.benefit')}
                    />
                  </div>
                  <div className={`mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight sm:gap-2 sm:text-lg ${getBenefitClass(yearTotals.benefitCents)}`}>
                    <SeriesBullet seriesKey="benefit" />
                    <span className="min-w-0 break-words">{formatCents(yearTotals.benefitCents)} EUR</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
                {t('labels.wealth')}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
                <div className="metric-card">
                  <div className="flex items-center justify-between">
                    <span>{t('labels.finalBalance')}</span>
                    <EyeToggle
                      hidden={!yearSeriesVisibility.balance}
                      onClick={() => toggleYearSeries('balance')}
                      label={t('series.balance')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                    <SeriesBullet seriesKey="balance" />
                    <span className="min-w-0 break-words">{formatCents(yearTotals.balanceCents)} EUR</span>
                  </div>
                </div>
                {hasInvestmentPortfolio ? (
                  <>
                    <div className="metric-card">
                      <div className="flex items-center justify-between">
                        <span>{t('labels.finalPortfolio')}</span>
                        <EyeToggle
                          hidden={!yearSeriesVisibility.portfolio}
                          onClick={() => toggleYearSeries('portfolio')}
                          label={t('series.portfolio')}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                        <SeriesBullet seriesKey="portfolio" />
                        <span className="min-w-0 break-words">{formatCents(yearTotals.portfolioCents)} EUR</span>
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="flex items-center justify-between">
                        <span>{t('labels.finalWealth')}</span>
                        <EyeToggle
                          hidden={!yearSeriesVisibility.totalWealth}
                          onClick={() => toggleYearSeries('totalWealth')}
                          label={t('series.totalWealth')}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                        <SeriesBullet seriesKey="totalWealth" />
                        <span className="min-w-0 break-words">{formatCents(yearTotals.totalWealthCents)} EUR</span>
                      </div>
                    </div>
                  </>
                ) : null}
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
                {activeChartTitle}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="segmented">
                  {(['summary', 'wealth'] as const).map((panel) => (
                    <button
                      key={panel}
                      type="button"
                      onClick={() => setActiveChartPanel(panel)}
                      className={`segmented-option px-3 py-1.5 text-[10px] tracking-[0.12em] sm:text-[11px] ${
                        activeChartPanel === panel ? 'segmented-option-active' : ''
                      }`}
                    >
                      {panel === 'summary' ? t('labels.cashFlowChart') : t('labels.wealthChart')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-muted sm:text-xs">
              {(activeChartPanel === 'summary' ? FLOW_TYPES : WEALTH_TYPES)
                .filter((item) => yearSeriesVisibility[item.key])
                .map((item) => (
                  <span key={item.key} className="flex items-center gap-2">
                    <SeriesBullet seriesKey={item.key} />
                    {t(item.labelKey)}
                  </span>
                ))}
            </div>
            <div className="mt-4">
              {!hasChartData ? (
                <p className="text-sm text-muted">{t('messages.noChartData')}</p>
              ) : activeChartPanel === 'summary' ? (
                <div className="chart-shell h-[160px] sm:h-[320px]" ref={yearChartContainerRef}>
                  <Bar
                    data={yearChartData}
                    options={compactYearChartOptions}
                    ref={yearChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                  />
                </div>
              ) : (
                <div className="chart-shell h-[160px] sm:h-[320px]" ref={yearWealthChartContainerRef}>
                  <Bar
                    data={yearWealthChartData}
                    options={compactYearWealthChartOptions}
                    ref={yearWealthChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                  />
                </div>
              )}
            </div>
          </div>
          </div>
        </details>

        <details className="group min-w-0 rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6">
          <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-muted list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.2em]">
            <span>{t('labels.monthDetail')} · {yearValue}</span>
            <span className="text-muted transition group-open:rotate-90">
              <ChevronIcon direction="right" />
            </span>
          </summary>
          <div className="mt-4 sm:hidden">
            <div
              className="-mx-1 flex touch-pan-x flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2"
              aria-label={t('labels.monthDetail')}
            >
              {(
                [
                  ['month', t('labels.month'), true],
                  ['income', t('series.income'), yearSeriesVisibility.income],
                  ['expense', t('series.expense'), yearSeriesVisibility.expense],
                  ['benefit', t('series.benefit'), yearSeriesVisibility.benefit],
                  ['balance', t('series.balance'), yearSeriesVisibility.balance],
                  ['portfolio', t('series.portfolio'), yearSeriesVisibility.portfolio],
                  ['totalWealth', t('series.totalWealth'), yearSeriesVisibility.totalWealth]
                ] as const
              ).map(([key, label, visible]) =>
                visible ? (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleYearSort(key)}
                    className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] transition ${
                      yearTableSort.key === key
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-ink/10 bg-white text-muted'
                    }`}
                  >
                    {label}
                    <SortIndicator active={yearTableSort.key === key} direction={yearTableSort.direction} />
                  </button>
                ) : null
              )}
            </div>
            {!hasChartData ? (
              <p className="py-6 text-center text-sm text-muted">{t('messages.noTableData')}</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {sortedYearSeries.map((point) => {
                  const trends = yearTrendByMonth.get(point.month);
                  const hasPointData = Boolean(trends);
                  return (
                    <article key={point.month} className="rounded-xl border border-ink/10 bg-white/90 p-3 shadow-sm">
                      <header className="flex items-center justify-between gap-3 border-b border-ink/5 pb-2">
                        <h3 className="font-semibold capitalize text-ink">
                          {getMonthLabel(point.month, locale, 'long')}
                        </h3>
                        {point.note ? (
                          <button
                            type="button"
                            onClick={() => setSelectedNote({ month: point.month, note: point.note })}
                            className="rounded-md p-1 text-accent2 transition hover:bg-accent/10 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                            aria-label={`${t('labels.monthNote')}: ${getMonthLabel(point.month, locale, 'long')}`}
                            title={t('labels.monthNote')}
                          >
                            <NoteIcon />
                          </button>
                        ) : null}
                      </header>
                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
                        {yearSeriesVisibility.income ? (
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted">{t('series.income')}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-ink">
                              <span>{formatCents(point.incomeCents)} EUR</span>
                              {trends ? <TrendIcon trend={trends.income} /> : null}
                            </p>
                          </div>
                        ) : null}
                        {yearSeriesVisibility.expense ? (
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted">{t('series.expense')}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-ink">
                              <span>{formatCents(point.expenseCents)} EUR</span>
                              {trends ? <TrendIcon trend={trends.expense} /> : null}
                            </p>
                          </div>
                        ) : null}
                        {yearSeriesVisibility.benefit ? (
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted">{t('series.benefit')}</p>
                            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${hasPointData ? getBenefitClass(point.benefitCents) : 'text-ink'}`}>
                              <span>{formatCents(point.benefitCents)} EUR</span>
                              {trends ? <TrendIcon trend={trends.benefit} /> : null}
                            </p>
                          </div>
                        ) : null}
                        {yearSeriesVisibility.balance ? (
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted">{t('series.balance')}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-ink">
                              <span>{formatCents(point.balanceCents)} EUR</span>
                              {trends ? <TrendIcon trend={trends.balance} /> : null}
                            </p>
                          </div>
                        ) : null}
                        {yearSeriesVisibility.portfolio ? (
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted">{t('series.portfolio')}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-ink">
                              <span>{formatCents(point.portfolioCents)} EUR</span>
                              {trends ? <TrendIcon trend={trends.portfolio} /> : null}
                            </p>
                          </div>
                        ) : null}
                        {yearSeriesVisibility.totalWealth ? (
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted">{t('series.totalWealth')}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-ink">
                              <span>{formatCents(point.totalWealthCents)} EUR</span>
                              {trends ? <TrendIcon trend={trends.totalWealth} /> : null}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[860px] text-left text-xs sm:text-sm">
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
                {yearSeriesVisibility.benefit ? (
                  <th className="py-3 pr-4">
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
                {yearSeriesVisibility.portfolio ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleYearSort('portfolio')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.portfolio')}
                      <SortIndicator
                        active={yearTableSort.key === 'portfolio'}
                        direction={yearTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {yearSeriesVisibility.totalWealth ? (
                  <th className="py-3">
                    <button
                      type="button"
                      onClick={() => handleYearSort('totalWealth')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.totalWealth')}
                      <SortIndicator
                        active={yearTableSort.key === 'totalWealth'}
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
                  const trends = yearTrendByMonth.get(point.month);
                  const hasPointData = Boolean(trends);
                  return (
                    <tr key={point.month} className="border-b border-ink/5">
                      <td className="py-3 pr-4 text-muted">
                        {point.note ? (
                          <span className="flex items-center gap-2">
                            <span>{getMonthLabel(point.month, locale, 'long')}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedNote({ month: point.month, note: point.note })}
                              className="rounded-md p-1 text-accent2 transition hover:bg-accent/10 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                              aria-label={`${t('labels.monthNote')}: ${getMonthLabel(point.month, locale, 'long')}`}
                              title={t('labels.monthNote')}
                            >
                              <NoteIcon />
                            </button>
                          </span>
                        ) : (
                          getMonthLabel(point.month, locale, 'long')
                        )}
                      </td>
                      {yearSeriesVisibility.income ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.incomeCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.income} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {yearSeriesVisibility.expense ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.expenseCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.expense} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {yearSeriesVisibility.benefit ? (
                        <td className={`py-3 pr-4 ${hasPointData ? getBenefitClass(point.benefitCents) : 'text-ink'}`}>
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.benefitCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.benefit} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {yearSeriesVisibility.balance ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.balanceCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.balance} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {yearSeriesVisibility.portfolio ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.portfolioCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.portfolio} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {yearSeriesVisibility.totalWealth ? (
                        <td className="py-3 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.totalWealthCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.totalWealth} /> : null}
                          </div>
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
      <details className="group min-w-0 rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-muted list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.2em]">
          <span>{t('insights.title')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-2">
          <InsightsPanel
            title={yearInsights.title}
            comparisons={yearInsights.comparisons}
            emptyLabel={yearInsights.emptyLabel}
            currentLabel={yearInsights.currentLabel}
            previousLabel={yearInsights.previousLabel}
            hasAnyData={yearInsights.hasAnyData}
            showTitle={false}
            containerClassName="rounded-none border-0 bg-transparent p-0 shadow-none"
            suppressEmptyComparisonKeys={['selectedYear']}
            comparisonHeaderControls={{
              selectedYear: (
                <select
                  aria-label={t('labels.compareYear')}
                  value={yearComparisonValue}
                  onChange={(event) => setYearComparisonValue(event.target.value)}
                  className="h-6 w-20 rounded-lg border border-ink/10 bg-white px-2 py-0 text-center text-xs font-normal normal-case tracking-normal text-ink shadow-sm focus:border-accent focus:outline-none"
                >
                  <option value="">{t('actions.none')}</option>
                  {comparisonYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )
            }}
          />
        </div>
      </details>
      </div>
      <InfoDialog
        open={Boolean(selectedNote)}
        title={
          selectedNote
            ? `${t('labels.monthNote')}: ${getMonthLabel(selectedNote.month, locale, 'long')} ${selectedNote.month.slice(0, 4)}`
            : t('labels.monthNote')
        }
        content={
          <p className="whitespace-pre-wrap break-words leading-relaxed text-ink">
            {selectedNote?.note}
          </p>
        }
        onClose={() => setSelectedNote(null)}
      />
      <ChartModal
        open={chartModalOpen}
        title={activeYearChartModalTitle}
        closeLabel={t('actions.close')}
        onClose={() => setChartModalOpen(false)}
        fullScreen
        requestLandscape={isMobile}
        rotateHint={t('messages.rotateDevice')}
      >
        <div className="h-full w-full overflow-x-auto">
          <div className="h-full" style={{ minWidth: `${yearChartModalMinWidth}px` }} ref={yearChartModalContainerRef}>
            {hasChartData ? (
              activeChartPanel === 'summary' ? (
                <Bar
                  data={yearChartData}
                  options={yearChartOptionsWithClick}
                  ref={yearChartModalRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                />
              ) : (
                <Bar
                  data={yearWealthChartData}
                  options={yearWealthChartOptionsWithClick}
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
    </div>
  );
}
