import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SeriesKey, SeriesTrendMap, SortDirection, AllTableSortKey } from '../../types';
import type { ChartData, ChartOptions } from 'chart.js';
import type { RefObject } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { ChartModal } from '../../components/ChartModal';
import { EyeToggle } from '../../components/EyeToggle';
import { SeriesBullet } from '../../components/SeriesBullet';
import { SortIndicator } from '../../components/SortIndicator';
import { ChevronIcon, TrendIcon } from '../../components/icons';
import { useChartResize, type ChartInstance } from '../../hooks/useChartResize';
import { useChartInteractionOptions } from '../../hooks/useChartInteractionOptions';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FLOW_TYPES, WEALTH_TYPES } from '../../constants';
import { formatCents, getBenefitClass } from '../../utils/format';
import '../../utils/chartSetup';
import { findBenefitExtremes } from '../../utils/metrics';

type AllYearsPoint = {
  year: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  benefitCents: number;
};

type HistoryTotals = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  benefitCents: number;
};

type SeriesChartData = ChartData<'bar', Array<number | null>, string>;
type SeriesChartOptions = ChartOptions<'bar'>;

type HistoryViewProps = {
  allYearsSeriesVisibility: Record<SeriesKey, boolean>;
  toggleAllYearsSeries: (key: SeriesKey) => void;
  showOnlyAllYearsSeries: (key: SeriesKey) => void;
  hasInvestmentPortfolio: boolean;
  hasAllYearsData: boolean;
  allYearsChartData: SeriesChartData;
  allYearsWealthChartData: SeriesChartData;
  allYearsChartOptions: SeriesChartOptions;
  sortedAllYears: AllYearsPoint[];
  allYearsTableSort: { key: AllTableSortKey; direction: SortDirection };
  handleAllYearsSort: (key: AllTableSortKey) => void;
  allYearsTrendByYear: Map<string, SeriesTrendMap>;
  onSelectYear: (year: string) => void;
};

export function HistoryView({
  allYearsSeriesVisibility,
  toggleAllYearsSeries,
  showOnlyAllYearsSeries,
  hasInvestmentPortfolio,
  hasAllYearsData,
  allYearsChartData,
  allYearsWealthChartData,
  allYearsChartOptions,
  sortedAllYears,
  allYearsTableSort,
  handleAllYearsSort,
  allYearsTrendByYear,
  onSelectYear
}: HistoryViewProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [activeChartPanel, setActiveChartPanel] = useState<'summary' | 'wealth'>('summary');
  const { chartRef: historyChartRef, containerRef: historyChartContainerRef } = useChartResize<
    'bar',
    Array<number | null>,
    string
  >();
  const { chartRef: historyChartModalRef, containerRef: historyChartModalContainerRef } = useChartResize<
    'bar',
    Array<number | null>,
    string
  >();
  const { chartRef: historyWealthChartRef, containerRef: historyWealthChartContainerRef } = useChartResize<
    'bar',
    Array<number | null>,
    string
  >();
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [pageSize, setPageSize] = useState<'5' | '10' | '15' | '20' | 'all'>('all');
  const [page, setPage] = useState(1);
  const chartLabels = useMemo(() => (allYearsChartData.labels ?? []) as string[], [allYearsChartData]);
  const wealthChartLabels = useMemo(
    () => (allYearsWealthChartData.labels ?? []) as string[],
    [allYearsWealthChartData]
  );
  const availableRangeYears = useMemo(
    () =>
      Array.from(new Set(sortedAllYears.map((point) => point.year))).sort((a, b) => Number(a) - Number(b)),
    [sortedAllYears]
  );
  const parsedFrom = rangeFrom.trim() ? Number(rangeFrom) : null;
  const parsedTo = rangeTo.trim() ? Number(rangeTo) : null;
  const minYearFilter =
    parsedFrom !== null && parsedTo !== null ? Math.min(parsedFrom, parsedTo) : parsedFrom;
  const maxYearFilter =
    parsedFrom !== null && parsedTo !== null ? Math.max(parsedFrom, parsedTo) : parsedTo;
  const hasRangeFilter = minYearFilter !== null || maxYearFilter !== null;
  const filteredAllYears = useMemo(() => {
    if (!hasRangeFilter) {
      return sortedAllYears;
    }
    return sortedAllYears.filter((point) => {
      const yearNumber = Number(point.year);
      if (!Number.isFinite(yearNumber)) {
        return false;
      }
      if (minYearFilter !== null && yearNumber < minYearFilter) {
        return false;
      }
      if (maxYearFilter !== null && yearNumber > maxYearFilter) {
        return false;
      }
      return true;
    });
  }, [hasRangeFilter, maxYearFilter, minYearFilter, sortedAllYears]);
  const filteredChartLabels = useMemo(() => {
    if (!hasRangeFilter) {
      return chartLabels;
    }
    return chartLabels.filter((label) => {
      const yearNumber = Number(label);
      if (!Number.isFinite(yearNumber)) {
        return false;
      }
      if (minYearFilter !== null && yearNumber < minYearFilter) {
        return false;
      }
      if (maxYearFilter !== null && yearNumber > maxYearFilter) {
        return false;
      }
      return true;
    });
  }, [chartLabels, hasRangeFilter, maxYearFilter, minYearFilter]);
  const filteredChartData = useMemo<SeriesChartData>(() => {
    const labelIndex = new Map(chartLabels.map((label, index) => [label, index]));
    const datasets: SeriesChartData['datasets'] = (allYearsChartData.datasets ?? []).map((dataset) => {
      const data = Array.isArray(dataset.data) ? (dataset.data as Array<number | null>) : [];
      const nextData: Array<number | null> = filteredChartLabels.map((label) => {
        const index = labelIndex.get(label);
        return index === undefined ? null : data[index] ?? null;
      });
      return { ...dataset, data: nextData } as SeriesChartData['datasets'][number];
    });
    return {
      ...allYearsChartData,
      labels: filteredChartLabels,
      datasets
    };
  }, [allYearsChartData, chartLabels, filteredChartLabels]);
  const filteredWealthChartLabels = useMemo(() => {
    if (!hasRangeFilter) {
      return wealthChartLabels;
    }
    return wealthChartLabels.filter((label) => {
      const yearNumber = Number(label);
      if (!Number.isFinite(yearNumber)) {
        return false;
      }
      if (minYearFilter !== null && yearNumber < minYearFilter) {
        return false;
      }
      if (maxYearFilter !== null && yearNumber > maxYearFilter) {
        return false;
      }
      return true;
    });
  }, [hasRangeFilter, maxYearFilter, minYearFilter, wealthChartLabels]);
  const filteredWealthChartData = useMemo<SeriesChartData>(() => {
    const labelIndex = new Map(wealthChartLabels.map((label, index) => [label, index]));
    const datasets: SeriesChartData['datasets'] = (allYearsWealthChartData.datasets ?? []).map((dataset) => {
      const data = Array.isArray(dataset.data) ? (dataset.data as Array<number | null>) : [];
      const nextData: Array<number | null> = filteredWealthChartLabels.map((label) => {
        const index = labelIndex.get(label);
        return index === undefined ? null : data[index] ?? null;
      });
      return { ...dataset, data: nextData } as SeriesChartData['datasets'][number];
    });
    return {
      ...allYearsWealthChartData,
      labels: filteredWealthChartLabels,
      datasets
    };
  }, [allYearsWealthChartData, filteredWealthChartLabels, wealthChartLabels]);
  const { best: bestBenefitYear, worst: worstBenefitYear } = useMemo(
    () => findBenefitExtremes(filteredAllYears),
    [filteredAllYears]
  );
  const historyTotals = useMemo<HistoryTotals>(() => {
    const totals = filteredAllYears.reduce<HistoryTotals>(
      (acc, point) => ({
        ...acc,
        incomeCents: acc.incomeCents + point.incomeCents,
        expenseCents: acc.expenseCents + point.expenseCents,
        benefitCents: acc.benefitCents + point.benefitCents
      }),
      {
        incomeCents: 0,
        expenseCents: 0,
        balanceCents: 0,
        portfolioCents: 0,
        totalWealthCents: 0,
        benefitCents: 0
      }
    );
    const latestPoint = filteredAllYears.reduce<AllYearsPoint | null>((latest, point) => {
      if (!latest) {
        return point;
      }
      return Number(point.year) > Number(latest.year) ? point : latest;
    }, null);

    return latestPoint
      ? {
          ...totals,
          balanceCents: latestPoint.balanceCents,
          portfolioCents: latestPoint.portfolioCents,
          totalWealthCents: latestPoint.totalWealthCents
        }
      : totals;
  }, [filteredAllYears]);
  const hasFilteredData = hasAllYearsData && filteredAllYears.length > 0;
  const pageSizeValue = pageSize === 'all' ? filteredAllYears.length : Number(pageSize);
  const totalPages =
    pageSize === 'all' || filteredAllYears.length === 0
      ? 1
      : Math.max(1, Math.ceil(filteredAllYears.length / pageSizeValue));
  const pagedAllYears = useMemo(() => {
    if (pageSize === 'all') {
      return filteredAllYears;
    }
    const start = (page - 1) * pageSizeValue;
    return filteredAllYears.slice(start, start + pageSizeValue);
  }, [filteredAllYears, page, pageSize, pageSizeValue]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, rangeFrom, rangeTo]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);
  const visibleColumns =
    1 +
    Number(allYearsSeriesVisibility.income) +
    Number(allYearsSeriesVisibility.expense) +
    Number(allYearsSeriesVisibility.benefit) +
    Number(allYearsSeriesVisibility.balance) +
    Number(allYearsSeriesVisibility.portfolio) +
    Number(allYearsSeriesVisibility.totalWealth);
  const openChartModal = useCallback(() => setChartModalOpen(true), []);
  const {
    interactiveOptions: historyChartOptionsWithClick,
    compactOptions: compactHistoryChartOptions
  } = useChartInteractionOptions({
    options: allYearsChartOptions,
    series: FLOW_TYPES,
    isMobile,
    onShowOnly: showOnlyAllYearsSeries,
    onOpenModal: openChartModal
  });
  const {
    interactiveOptions: historyWealthChartOptionsWithClick,
    compactOptions: compactHistoryWealthChartOptions
  } = useChartInteractionOptions({
    options: allYearsChartOptions,
    series: WEALTH_TYPES,
    isMobile,
    onShowOnly: showOnlyAllYearsSeries,
    onOpenModal: openChartModal
  });
  const historyChartModalMinWidth = Math.max(360, filteredChartLabels.length * 56);
  const historyRangeLabel = useMemo(() => {
    if (filteredAllYears.length === 0) {
      return t('labels.allYears');
    }
    const years = filteredAllYears.map((point) => Number(point.year)).filter(Number.isFinite);
    if (years.length === 0) {
      return t('labels.allYears');
    }
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return minYear === maxYear ? String(minYear) : `${minYear} - ${maxYear}`;
  }, [filteredAllYears, t]);
  const activeChartTitle =
    activeChartPanel === 'summary' ? t('labels.cashFlowChart') : t('labels.wealthChart');
  return (
    <>
      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6" open>
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-accent2 list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.28em]">
          <span>{t('labels.historyChart')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-2">
          <div className={isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-[1fr_auto_1fr] items-start gap-4'}>
            <div>
              <h2 className="text-xl font-semibold text-ink sm:text-2xl">{historyRangeLabel}</h2>
            </div>
            <div className={`${isMobile ? 'w-full' : 'justify-self-center flex items-center gap-2'} text-[10px] text-muted sm:text-xs`}>
              <span className="text-[10px] uppercase tracking-[0.16em] sm:text-[11px] sm:tracking-[0.18em]">
                {t('labels.yearRange')}
              </span>
              <div className={`${isMobile ? 'mt-2 grid grid-cols-[1fr_auto_1fr] gap-2' : 'inline-flex items-center gap-2'}`}>
                <select
                  aria-label={t('labels.from')}
                  value={rangeFrom}
                  onChange={(event) => setRangeFrom(event.target.value)}
                  className={`rounded-xl border border-ink/10 bg-white text-center text-ink shadow-sm focus:border-accent focus:outline-none ${
                    isMobile ? 'px-3 py-2 text-[11px] leading-4' : 'w-24 px-3 py-2 text-base sm:text-sm'
                  }`}
                >
                  <option value="">{t('labels.from')}</option>
                  {availableRangeYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <span className="text-muted text-center">-</span>
                <select
                  aria-label={t('labels.to')}
                  value={rangeTo}
                  onChange={(event) => setRangeTo(event.target.value)}
                  className={`rounded-xl border border-ink/10 bg-white text-center text-ink shadow-sm focus:border-accent focus:outline-none ${
                    isMobile ? 'px-3 py-2 text-[11px] leading-4' : 'w-24 px-3 py-2 text-base sm:text-sm'
                  }`}
                >
                  <option value="">{t('labels.to')}</option>
                  {availableRangeYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!isMobile ? <div aria-hidden="true"></div> : null}
          </div>
          <div className="mt-5 grid gap-5 sm:mt-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
                {t('labels.cashFlow')}
              </p>
              <div className={`mt-3 grid grid-cols-2 gap-2 sm:gap-4 ${hasInvestmentPortfolio ? 'sm:grid-cols-3' : ''}`}>
                <div className="rounded-xl border border-ink/10 bg-white/90 p-2 text-xs text-muted sm:p-3 sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span>{t('labels.totalIncome')}</span>
                    <EyeToggle
                      hidden={!allYearsSeriesVisibility.income}
                      onClick={() => toggleAllYearsSeries('income')}
                      label={t('series.income')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                    <SeriesBullet seriesKey="income" />
                    <span className="min-w-0 break-words">{formatCents(historyTotals.incomeCents)} EUR</span>
                  </div>
                </div>
                <div className="rounded-xl border border-ink/10 bg-white/90 p-2 text-xs text-muted sm:p-3 sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span>{t('labels.totalExpense')}</span>
                    <EyeToggle
                      hidden={!allYearsSeriesVisibility.expense}
                      onClick={() => toggleAllYearsSeries('expense')}
                      label={t('series.expense')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                    <SeriesBullet seriesKey="expense" />
                    <span className="min-w-0 break-words">{formatCents(historyTotals.expenseCents)} EUR</span>
                  </div>
                </div>
                <div className="rounded-xl border border-ink/10 bg-white/90 p-2 text-xs text-muted sm:p-3 sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span>{t('labels.totalBenefit')}</span>
                    <EyeToggle
                      hidden={!allYearsSeriesVisibility.benefit}
                      onClick={() => toggleAllYearsSeries('benefit')}
                      label={t('series.benefit')}
                    />
                  </div>
                  <div className={`mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight sm:gap-2 sm:text-lg ${getBenefitClass(historyTotals.benefitCents)}`}>
                    <SeriesBullet seriesKey="benefit" />
                    <span className="min-w-0 break-words">{formatCents(historyTotals.benefitCents)} EUR</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
                {t('labels.wealth')}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-xl border border-ink/10 bg-white/90 p-2 text-xs text-muted sm:p-3 sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span>{t('labels.finalBalance')}</span>
                    <EyeToggle
                      hidden={!allYearsSeriesVisibility.balance}
                      onClick={() => toggleAllYearsSeries('balance')}
                      label={t('series.balance')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                    <SeriesBullet seriesKey="balance" />
                    <span className="min-w-0 break-words">{formatCents(historyTotals.balanceCents)} EUR</span>
                  </div>
                </div>
                {hasInvestmentPortfolio ? (
                  <>
                    <div className="rounded-xl border border-ink/10 bg-white/90 p-2 text-xs text-muted sm:p-3 sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span>{t('labels.finalPortfolio')}</span>
                        <EyeToggle
                          hidden={!allYearsSeriesVisibility.portfolio}
                          onClick={() => toggleAllYearsSeries('portfolio')}
                          label={t('series.portfolio')}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                        <SeriesBullet seriesKey="portfolio" />
                        <span className="min-w-0 break-words">{formatCents(historyTotals.portfolioCents)} EUR</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-ink/10 bg-white/90 p-2 text-xs text-muted sm:p-3 sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span>{t('labels.finalWealth')}</span>
                        <EyeToggle
                          hidden={!allYearsSeriesVisibility.totalWealth}
                          onClick={() => toggleAllYearsSeries('totalWealth')}
                          label={t('series.totalWealth')}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink sm:gap-2 sm:text-lg">
                        <SeriesBullet seriesKey="totalWealth" />
                        <span className="min-w-0 break-words">{formatCents(historyTotals.totalWealthCents)} EUR</span>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          {bestBenefitYear && allYearsSeriesVisibility.benefit ? (
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                <TrendIcon trend="up" />
                <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                  {t('labels.bestBenefitYear', { year: bestBenefitYear.year })}
                  <span className="flex gap-1 items-center font-semibold text-benefit whitespace-nowrap">
                    <TrendIcon trend="right" /> {formatCents(bestBenefitYear.benefitCents)} EUR
                  </span>
                </span>
              </li>
              {worstBenefitYear && worstBenefitYear.year !== bestBenefitYear.year ? (
                <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                  <TrendIcon trend="down" />
                  <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                    {t('labels.worstBenefitYear', { year: worstBenefitYear.year })}
                    <span className="flex gap-1 items-center font-semibold text-benefitNegative whitespace-nowrap">
                      <TrendIcon trend="right" />
                      {formatCents(worstBenefitYear.benefitCents)} EUR
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
                .filter((item) => allYearsSeriesVisibility[item.key])
                .map((item) => (
                  <span key={item.key} className="flex items-center gap-2">
                    <SeriesBullet seriesKey={item.key} />
                    {t(item.labelKey)}
                  </span>
                ))}
            </div>
            <div className="mt-4">
              {!hasFilteredData ? (
                <p className="text-sm text-muted">{t('messages.noChartData')}</p>
              ) : activeChartPanel === 'summary' ? (
                <div className="h-[160px] sm:h-[360px]" ref={historyChartContainerRef}>
                  <Bar
                    data={filteredChartData}
                    options={compactHistoryChartOptions}
                    ref={historyChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                  />
                </div>
              ) : (
                <div className="h-[160px] sm:h-[360px]" ref={historyWealthChartContainerRef}>
                  <Bar
                    data={filteredWealthChartData}
                    options={compactHistoryWealthChartOptions}
                    ref={historyWealthChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </details>
      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-muted list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.2em]">
          <span>{t('labels.yearDetail')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted sm:text-xs">
          <label className="flex items-center gap-2">
            {t('labels.showRows')}
            <select
              value={pageSize}
              onChange={(event) => setPageSize(event.target.value as '5' | '10' | '15' | '20' | 'all')}
              className={`rounded-lg border border-ink/10 bg-white text-ink ${
                isMobile ? 'px-2 py-1 text-[10px]' : 'px-2 py-1 text-base sm:text-xs'
              }`}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="all">{t('actions.viewAll')}</option>
            </select>
          </label>
        </div>
        <div className="mt-4 sm:hidden">
          <div
            className="-mx-1 flex touch-pan-x flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2"
            aria-label={t('labels.yearDetail')}
          >
            {(
              [
                ['year', t('labels.year'), true],
                ['income', t('series.income'), allYearsSeriesVisibility.income],
                ['expense', t('series.expense'), allYearsSeriesVisibility.expense],
                ['benefit', t('series.benefit'), allYearsSeriesVisibility.benefit],
                ['balance', t('series.balance'), allYearsSeriesVisibility.balance],
                ['portfolio', t('series.portfolio'), allYearsSeriesVisibility.portfolio],
                ['totalWealth', t('series.totalWealth'), allYearsSeriesVisibility.totalWealth]
              ] as const
            ).map(([key, label, visible]) =>
              visible ? (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAllYearsSort(key)}
                  className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] transition ${
                    allYearsTableSort.key === key
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-ink/10 bg-white text-muted'
                  }`}
                >
                  {label}
                  <SortIndicator
                    active={allYearsTableSort.key === key}
                    direction={allYearsTableSort.direction}
                  />
                </button>
              ) : null
            )}
          </div>
          {!hasFilteredData ? (
            <p className="py-6 text-center text-sm text-muted">{t('messages.noTableData')}</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {pagedAllYears.map((point) => {
                const trends = allYearsTrendByYear.get(point.year);
                const metrics = [
                  {
                    key: 'income',
                    label: t('series.income'),
                    visible: allYearsSeriesVisibility.income,
                    value: point.incomeCents,
                    trend: trends?.income,
                    className: 'text-ink'
                  },
                  {
                    key: 'expense',
                    label: t('series.expense'),
                    visible: allYearsSeriesVisibility.expense,
                    value: point.expenseCents,
                    trend: trends?.expense,
                    className: 'text-ink'
                  },
                  {
                    key: 'benefit',
                    label: t('series.benefit'),
                    visible: allYearsSeriesVisibility.benefit,
                    value: point.benefitCents,
                    trend: trends?.benefit,
                    className: getBenefitClass(point.benefitCents)
                  },
                  {
                    key: 'balance',
                    label: t('series.balance'),
                    visible: allYearsSeriesVisibility.balance,
                    value: point.balanceCents,
                    trend: trends?.balance,
                    className: 'text-ink'
                  },
                  {
                    key: 'portfolio',
                    label: t('series.portfolio'),
                    visible: allYearsSeriesVisibility.portfolio,
                    value: point.portfolioCents,
                    trend: trends?.portfolio,
                    className: 'text-ink'
                  },
                  {
                    key: 'totalWealth',
                    label: t('series.totalWealth'),
                    visible: allYearsSeriesVisibility.totalWealth,
                    value: point.totalWealthCents,
                    trend: trends?.totalWealth,
                    className: 'text-ink'
                  }
                ] as const;
                return (
                  <article key={point.year} className="rounded-xl border border-ink/10 bg-white/90 p-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => onSelectYear(point.year)}
                      className="w-full border-b border-ink/5 pb-2 text-left font-semibold text-ink transition hover:text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      {point.year}
                    </button>
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
                      {metrics.map((metric) =>
                        metric.visible ? (
                          <div key={metric.key} className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-muted">{metric.label}</p>
                            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${metric.className}`}>
                              <span>{formatCents(metric.value)} EUR</span>
                              {metric.trend ? <TrendIcon trend={metric.trend} /> : null}
                            </p>
                          </div>
                        ) : null
                      )}
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
                    onClick={() => handleAllYearsSort('year')}
                    className="inline-flex items-center gap-1"
                  >
                    {t('labels.year')}
                    <SortIndicator active={allYearsTableSort.key === 'year'} direction={allYearsTableSort.direction} />
                  </button>
                </th>
                {allYearsSeriesVisibility.income ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleAllYearsSort('income')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.income')}
                      <SortIndicator
                        active={allYearsTableSort.key === 'income'}
                        direction={allYearsTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {allYearsSeriesVisibility.expense ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleAllYearsSort('expense')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.expense')}
                      <SortIndicator
                        active={allYearsTableSort.key === 'expense'}
                        direction={allYearsTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {allYearsSeriesVisibility.benefit ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleAllYearsSort('benefit')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.benefit')}
                      <SortIndicator
                        active={allYearsTableSort.key === 'benefit'}
                        direction={allYearsTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {allYearsSeriesVisibility.balance ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleAllYearsSort('balance')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.balance')}
                      <SortIndicator
                        active={allYearsTableSort.key === 'balance'}
                        direction={allYearsTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {allYearsSeriesVisibility.portfolio ? (
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleAllYearsSort('portfolio')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.portfolio')}
                      <SortIndicator
                        active={allYearsTableSort.key === 'portfolio'}
                        direction={allYearsTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
                {allYearsSeriesVisibility.totalWealth ? (
                  <th className="py-3">
                    <button
                      type="button"
                      onClick={() => handleAllYearsSort('totalWealth')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('series.totalWealth')}
                      <SortIndicator
                        active={allYearsTableSort.key === 'totalWealth'}
                        direction={allYearsTableSort.direction}
                      />
                    </button>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {!hasFilteredData ? (
                <tr>
                  <td colSpan={visibleColumns} className="py-6 text-center text-sm text-muted">
                    {t('messages.noTableData')}
                  </td>
                </tr>
              ) : (
                pagedAllYears.map((point) => {
                  const trends = allYearsTrendByYear.get(point.year);
                  return (
                    <tr key={point.year} className="border-b border-ink/5">
                      <td className="py-3 pr-4 text-muted">
                        <button
                          type="button"
                          onClick={() => onSelectYear(point.year)}
                          className="transition hover:text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                          {point.year}
                        </button>
                      </td>
                      {allYearsSeriesVisibility.income ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.incomeCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.income} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {allYearsSeriesVisibility.expense ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.expenseCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.expense} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {allYearsSeriesVisibility.benefit ? (
                        <td className={`py-3 pr-4 ${getBenefitClass(point.benefitCents)}`}>
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.benefitCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.benefit} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {allYearsSeriesVisibility.balance ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.balanceCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.balance} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {allYearsSeriesVisibility.portfolio ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.portfolioCents)} EUR</span>
                            {trends ? <TrendIcon trend={trends.portfolio} /> : null}
                          </div>
                        </td>
                      ) : null}
                      {allYearsSeriesVisibility.totalWealth ? (
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
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-[10px] text-muted sm:text-xs">
          {pageSize !== 'all' && totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="btn btn-neutral px-3 py-1 text-[10px] sm:text-[11px]"
              >
                {t('actions.previous')}
              </button>
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-[11px] sm:tracking-[0.18em]">
                {t('labels.page')} {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="btn btn-neutral px-3 py-1 text-[10px] sm:text-[11px]"
              >
                {t('actions.next')}
              </button>
            </div>
          ) : null}
        </div>
      </details>
      <ChartModal
        open={chartModalOpen}
        title={activeChartTitle}
        closeLabel={t('actions.close')}
        onClose={() => setChartModalOpen(false)}
        fullScreen
        requestLandscape={isMobile}
        rotateHint={t('messages.rotateDevice')}
      >
        <div className="h-full w-full overflow-x-auto">
          <div
            className="h-full"
            style={{ minWidth: `${historyChartModalMinWidth}px` }}
            ref={historyChartModalContainerRef}
          >
            {hasFilteredData ? (
              activeChartPanel === 'summary' ? (
                <Bar
                  data={filteredChartData}
                  options={historyChartOptionsWithClick}
                  ref={historyChartModalRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                />
              ) : (
                <Bar
                  data={filteredWealthChartData}
                  options={historyWealthChartOptionsWithClick}
                  ref={historyChartModalRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
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
