import { useEffect, useMemo, useState } from 'react';
import type { BalanceTrend, ChartType, SeriesKey, SortDirection, AllTableSortKey } from '../../types';
import type { ActiveElement, ChartData, ChartEvent, ChartOptions } from 'chart.js';
import type { RefObject } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { ChartTypeToggle } from '../../components/ChartTypeToggle';
import { ChartModal } from '../../components/ChartModal';
import { EyeToggle } from '../../components/EyeToggle';
import { SortIndicator } from '../../components/SortIndicator';
import { ChevronIcon, TrendIcon } from '../../components/icons';
import { useChartResize, type ChartInstance } from '../../hooks/useChartResize';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BAR_TYPES } from '../../constants';
import { formatCents, getBenefitClass } from '../../utils/format';

type AllYearsPoint = {
  year: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  benefitCents: number;
};

type SeriesChartData = ChartData<'bar' | 'line', Array<number | null>, string>;
type SeriesChartOptions = ChartOptions<'bar' | 'line'>;

type HistoryViewProps = {
  allYearsSeriesVisibility: Record<SeriesKey, boolean>;
  toggleAllYearsSeries: (key: SeriesKey) => void;
  showOnlyAllYearsSeries: (key: SeriesKey) => void;
  hasAllYearsData: boolean;
  allYearsChartData: SeriesChartData;
  allYearsChartOptions: SeriesChartOptions;
  allYearsChartType: ChartType;
  setAllYearsChartType: (value: ChartType) => void;
  sortedAllYears: AllYearsPoint[];
  allYearsTableSort: { key: AllTableSortKey; direction: SortDirection };
  handleAllYearsSort: (key: AllTableSortKey) => void;
  allYearsTrendByYear: Map<string, BalanceTrend>;
  isAllYearsLine: boolean;
};

export function HistoryView({
  allYearsSeriesVisibility,
  toggleAllYearsSeries,
  showOnlyAllYearsSeries,
  hasAllYearsData,
  allYearsChartData,
  allYearsChartOptions,
  allYearsChartType,
  setAllYearsChartType,
  sortedAllYears,
  allYearsTableSort,
  handleAllYearsSort,
  allYearsTrendByYear,
  isAllYearsLine
}: HistoryViewProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const { chartRef: historyChartRef, containerRef: historyChartContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const { chartRef: historyChartModalRef, containerRef: historyChartModalContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [pageSize, setPageSize] = useState<'5' | '10' | '15' | '20' | 'all'>('all');
  const [page, setPage] = useState(1);
  const chartLabels = useMemo(() => (allYearsChartData.labels ?? []) as string[], [allYearsChartData]);
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
  const { bestBenefitYear, worstBenefitYear } = useMemo(() => {
    if (filteredAllYears.length === 0) {
      return { bestBenefitYear: null, worstBenefitYear: null };
    }
    let best = filteredAllYears[0];
    let worst = filteredAllYears[0];
    for (const point of filteredAllYears) {
      if (point.benefitCents > best.benefitCents) {
        best = point;
      }
      if (point.benefitCents < worst.benefitCents) {
        worst = point;
      }
    }
    return { bestBenefitYear: best, worstBenefitYear: worst };
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
    Number(allYearsSeriesVisibility.balance) +
    Number(allYearsSeriesVisibility.benefit);
  const handleHistoryChartClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    const element = elements[0];
    if (!element) {
      return;
    }
    const seriesKey = BAR_TYPES[element.datasetIndex]?.key;
    if (!seriesKey) {
      return;
    }
    showOnlyAllYearsSeries(seriesKey);
  };
  const historyChartOptionsWithClick: SeriesChartOptions = {
    ...allYearsChartOptions,
    onClick: handleHistoryChartClick
  };
  const compactHistoryChartOptions: SeriesChartOptions = isMobile
    ? {
        ...historyChartOptionsWithClick,
        scales: {
          ...historyChartOptionsWithClick.scales,
          x: {
            ...(historyChartOptionsWithClick.scales?.x ?? {}),
            ticks: {
              ...((historyChartOptionsWithClick.scales?.x as { ticks?: unknown })?.ticks ?? {}),
              autoSkip: true,
              maxTicksLimit: 6
            }
          },
          y: {
            ...(historyChartOptionsWithClick.scales?.y ?? {}),
            ticks: {
              ...((historyChartOptionsWithClick.scales?.y as { ticks?: unknown })?.ticks ?? {}),
              maxTicksLimit: 5
            }
          }
        }
      }
    : historyChartOptionsWithClick;
  const historyChartModalMinWidth = Math.max(360, filteredChartLabels.length * 56);
  return (
    <>
      <details className="group rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6" open>
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-accent2 list-none [&::-webkit-details-marker]:hidden sm:text-xs sm:tracking-[0.28em]">
          <span>{t('labels.historyChart')}</span>
          <span className="text-muted transition group-open:rotate-90">
            <ChevronIcon direction="right" />
          </span>
        </summary>
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent2 sm:text-xs sm:tracking-[0.28em]">
                {t('labels.historyTotal')}
              </p>
              <h2 className="text-xl font-semibold text-ink sm:text-2xl">{t('labels.allYears')}</h2>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-[10px] text-muted sm:text-xs">
            <div className="grid grid-cols-2 gap-2">
              {BAR_TYPES.map((item) => {
                const seriesKey = item.key as SeriesKey;
                const label = t(item.labelKey);
                return (
                  <span key={item.key} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-sm ${item.colorClass}`} />
                    {label}
                    <EyeToggle
                      hidden={!allYearsSeriesVisibility[seriesKey]}
                      onClick={() => toggleAllYearsSeries(seriesKey)}
                      label={label}
                    />
                  </span>
                );
              })}
            </div>
            <div className={`${isMobile ? 'w-full' : ''}`}>
              <span className="text-[10px] uppercase tracking-[0.16em] sm:text-[11px] sm:tracking-[0.18em]">
                {t('labels.yearRange')}
              </span>
              <div className={`${isMobile ? 'mt-2 grid grid-cols-[1fr_auto_1fr] gap-2' : 'mt-0 inline-flex items-center gap-2 ml-2'}`}>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={t('labels.from')}
                  value={rangeFrom}
                  onChange={(event) => setRangeFrom(event.target.value)}
                  className={`rounded-lg border border-ink/10 bg-white text-ink text-center ${
                    isMobile ? 'px-3 py-1.5 text-[10px]' : 'w-20 px-2 py-1 text-base sm:text-xs'
                  }`}
                />
                <span className="text-muted text-center">-</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={t('labels.to')}
                  value={rangeTo}
                  onChange={(event) => setRangeTo(event.target.value)}
                  className={`rounded-lg border border-ink/10 bg-white text-ink text-center ${
                    isMobile ? 'px-3 py-1.5 text-[10px]' : 'w-20 px-2 py-1 text-base sm:text-xs'
                  }`}
                />
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
                {t('labels.historyChart')}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <ChartTypeToggle value={allYearsChartType} onChange={setAllYearsChartType} />
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
              {!hasFilteredData ? (
                <p className="text-sm text-muted">{t('messages.noChartData')}</p>
              ) : (
                <div className="h-[160px] sm:h-[360px]" ref={historyChartContainerRef}>
                  {isAllYearsLine ? (
                    <Line
                      data={filteredChartData as ChartData<'line', Array<number | null>, string>}
                      options={compactHistoryChartOptions as ChartOptions<'line'>}
                      ref={historyChartRef as RefObject<ChartInstance<'line', Array<number | null>, unknown>>}
                    />
                  ) : (
                    <Bar
                      data={filteredChartData as ChartData<'bar', Array<number | null>, string>}
                      options={compactHistoryChartOptions as ChartOptions<'bar'>}
                      ref={historyChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
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
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs sm:text-sm">
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
                {allYearsSeriesVisibility.benefit ? (
                  <th className="py-3">
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
                  const trend = allYearsTrendByYear.get(point.year) ?? 'flat';
                  return (
                    <tr key={point.year} className="border-b border-ink/5">
                      <td className="py-3 pr-4 text-muted">{point.year}</td>
                      {allYearsSeriesVisibility.income ? (
                        <td className="py-3 pr-4 text-ink">{formatCents(point.incomeCents)} EUR</td>
                      ) : null}
                      {allYearsSeriesVisibility.expense ? (
                        <td className="py-3 pr-4 text-ink">{formatCents(point.expenseCents)} EUR</td>
                      ) : null}
                      {allYearsSeriesVisibility.balance ? (
                        <td className="py-3 pr-4 text-ink">
                          <div className="flex items-center gap-2">
                            <span>{formatCents(point.balanceCents)} EUR</span>
                            <TrendIcon trend={trend} />
                          </div>
                        </td>
                      ) : null}
                      {allYearsSeriesVisibility.benefit ? (
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
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-[10px] text-muted sm:text-xs">
          {pageSize !== 'all' && totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-full border border-ink/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px] sm:tracking-[0.18em]"
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
                className="rounded-full border border-ink/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px] sm:tracking-[0.18em]"
              >
                {t('actions.next')}
              </button>
            </div>
          ) : null}
        </div>
      </details>
      <ChartModal
        open={chartModalOpen}
        title={t('labels.historyChart')}
        closeLabel={t('actions.close')}
        onClose={() => setChartModalOpen(false)}
        fullScreen={isMobile}
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
              isAllYearsLine ? (
                <Line
                  data={filteredChartData as ChartData<'line', Array<number | null>, string>}
                  options={historyChartOptionsWithClick as ChartOptions<'line'>}
                  ref={historyChartModalRef as RefObject<ChartInstance<'line', Array<number | null>, unknown>>}
                />
              ) : (
                <Bar
                  data={filteredChartData as ChartData<'bar', Array<number | null>, string>}
                  options={historyChartOptionsWithClick as ChartOptions<'bar'>}
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
