import type { FormState, SeriesKey, ChartType } from '../../types';
import type { MonthlySummary } from '../../db';
import type { ActiveElement, ChartData, ChartEvent, ChartOptions } from 'chart.js';
import type { RefObject } from 'react';
import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { ChartModal } from '../../components/ChartModal';
import { ChartTypeToggle } from '../../components/ChartTypeToggle';
import { MonthPicker } from '../../components/MonthPicker';
import { EyeToggle } from '../../components/EyeToggle';
import { ChevronIcon } from '../../components/icons';
import { useChartResize, type ChartInstance } from '../../hooks/useChartResize';
import { useIsMobile } from '../../hooks/useIsMobile';
import { formatCents, getBenefitClass } from '../../utils/format';
import { getMonthLabel, shiftMonthValue } from '../../utils/date';

type SeriesChartData = ChartData<'bar' | 'line', Array<number | null>, string>;
type SeriesChartOptions = ChartOptions<'bar' | 'line'>;

const MONTH_SERIES_ORDER: SeriesKey[] = ['income', 'expense', 'balance'];

type MonthViewProps = {
  monthValue: string;
  setMonthValue: (value: string | ((prev: string) => string)) => void;
  currentMonthValue: string;
  isCurrentMonth: boolean;
  displaySummary: MonthlySummary;
  monthSeriesVisibility: Record<SeriesKey, boolean>;
  toggleMonthSeries: (key: SeriesKey) => void;
  showOnlyMonthSeries: (key: SeriesKey) => void;
  monthBenefitDotClass: string;
  monthChartType: ChartType;
  setMonthChartType: (value: ChartType) => void;
  monthChartData: SeriesChartData;
  monthChartOptions: SeriesChartOptions;
  benefitChartData: SeriesChartData;
  benefitChartOptions: SeriesChartOptions;
  hasMonthData: boolean;
  hasVisibleMonthBars: boolean;
  showMonthBenefit: boolean;
  isMonthLine: boolean;
  form: FormState;
  onFormChange: (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  error: string | null;
  readOnly?: boolean;
  onOpenSettings?: () => void;
};

export function MonthView({
  monthValue,
  setMonthValue,
  currentMonthValue,
  isCurrentMonth,
  displaySummary,
  monthSeriesVisibility,
  toggleMonthSeries,
  showOnlyMonthSeries,
  monthBenefitDotClass,
  monthChartType,
  setMonthChartType,
  monthChartData,
  monthChartOptions,
  benefitChartData,
  benefitChartOptions,
  hasMonthData,
  hasVisibleMonthBars,
  showMonthBenefit,
  isMonthLine,
  form,
  onFormChange,
  onSubmit,
  saving,
  error,
  readOnly = false,
  onOpenSettings
}: MonthViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const isMobile = useIsMobile();
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const { chartRef: monthChartRef, containerRef: monthChartContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const { chartRef: monthChartModalRef, containerRef: monthChartModalContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const { chartRef: benefitChartRef, containerRef: benefitChartContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const showMonthBenefitSection = hasMonthData;
  const handleMonthChartClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    const element = elements[0];
    if (!element) {
      return;
    }
    const seriesKey = MONTH_SERIES_ORDER[element.index];
    if (!seriesKey) {
      return;
    }
    showOnlyMonthSeries(seriesKey);
  };
  const monthChartOptionsWithClick: SeriesChartOptions = {
    ...monthChartOptions,
    onClick: handleMonthChartClick
  };
  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <section className="order-2 min-w-0 rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6 lg:order-1">
        <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-wrap items-start justify-between'}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-accent2 sm:text-xs sm:tracking-[0.28em]">
              {t('labels.monthSummary')}
            </p>
            <h2 className="text-xl font-semibold text-ink sm:text-2xl">
              {getMonthLabel(monthValue, locale, 'long')} {monthValue.slice(0, 4)}
            </h2>
          </div>
          {isMobile ? (
            <div className="grid w-full gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMonthValue((prev) => shiftMonthValue(prev, -1))}
                  aria-label={t('actions.previousMonth')}
                  title={t('actions.previousMonth')}
                  className={`flex items-center justify-center rounded-full border border-ink/10 bg-white text-muted shadow-sm transition hover:border-accent hover:text-ink ${
                    isMobile ? 'h-8 w-8 p-0' : 'p-1'
                  }`}
                >
                  <ChevronIcon direction="left" />
                </button>
                <MonthPicker
                  label={t('labels.currentMonth')}
                  value={monthValue}
                  onChange={setMonthValue}
                  className="flex-1"
                  buttonClassName="w-full justify-between px-3 py-2 text-[11px] leading-4"
                  labelClassName="flex-1 text-center text-[11px] leading-4"
                  iconClassName="h-4 w-4"
                />
                <button
                  type="button"
                  onClick={() => setMonthValue((prev) => shiftMonthValue(prev, 1))}
                  aria-label={t('actions.nextMonth')}
                  title={t('actions.nextMonth')}
                  className={`flex items-center justify-center rounded-full border border-ink/10 bg-white text-muted shadow-sm transition hover:border-accent hover:text-ink ${
                    isMobile ? 'h-8 w-8 p-0' : 'p-1'
                  }`}
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setMonthValue(currentMonthValue)}
                disabled={isCurrentMonth}
                className={`w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition ${
                  isCurrentMonth ? 'cursor-default opacity-60' : ' hover:border-accent hover:text-ink'
                }`}
              >
                {t('actions.gotoCurrentMonth')}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMonthValue((prev) => shiftMonthValue(prev, -1))}
                    aria-label={t('actions.previousMonth')}
                    title={t('actions.previousMonth')}
                    className="rounded-full border border-ink/10 bg-white p-1 text-muted shadow-sm transition hover:border-accent hover:text-ink"
                  >
                    <ChevronIcon direction="left" />
                  </button>
                  <MonthPicker label={t('labels.currentMonth')} value={monthValue} onChange={setMonthValue} />
                  <button
                    type="button"
                    onClick={() => setMonthValue((prev) => shiftMonthValue(prev, 1))}
                    aria-label={t('actions.nextMonth')}
                    title={t('actions.nextMonth')}
                    className="rounded-full border border-ink/10 bg-white p-1 text-muted shadow-sm transition hover:border-accent hover:text-ink"
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMonthValue(currentMonthValue)}
                  disabled={isCurrentMonth}
                  className={`rounded-xl border border-ink/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition sm:text-[11px] sm:tracking-[0.18em] ${
                    isCurrentMonth
                      ? 'cursor-default opacity-60'
                      : ' hover:border-accent hover:text-ink'
                  }`}
                >
                  {t('actions.gotoCurrentMonth')}
                </button>
              </div>
              <div aria-hidden="true"></div>
            </>
          )}
        </div>
        <div
          className={`mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4`}
        >
          <div className="rounded-xl border border-ink/10 bg-white/90 p-2.5 lg:p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.18em] lg:text-xs lg:tracking-[0.2em]">
                {t('series.income')}
              </p>
              <EyeToggle
                hidden={!monthSeriesVisibility.income}
                onClick={() => toggleMonthSeries('income')}
                label={t('series.income')}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-ink sm:text-xl lg:text-2xl">
              <span className="h-2.5 w-2.5 rounded-full bg-income" />
              <span>{formatCents(displaySummary.incomeCents)} EUR</span>
            </div>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/90 p-2.5 lg:p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.18em] lg:text-xs lg:tracking-[0.2em]">
                {t('series.expense')}
              </p>
              <EyeToggle
                hidden={!monthSeriesVisibility.expense}
                onClick={() => toggleMonthSeries('expense')}
                label={t('series.expense')}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-ink sm:text-xl lg:text-2xl">
              <span className="h-2.5 w-2.5 rounded-full bg-expense" />
              <span>{formatCents(displaySummary.expenseCents)} EUR</span>
            </div>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/90 p-2.5 lg:p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.18em] lg:text-xs lg:tracking-[0.2em]">
                {t('series.balance')}
              </p>
              <EyeToggle
                hidden={!monthSeriesVisibility.balance}
                onClick={() => toggleMonthSeries('balance')}
                label={t('series.balance')}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-ink sm:text-xl lg:text-2xl">
              <span className="h-2.5 w-2.5 rounded-full bg-balance" />
              <span>{formatCents(displaySummary.balanceCents)} EUR</span>
            </div>
          </div>
          {showMonthBenefitSection ? (
            <div className="rounded-xl border border-ink/10 bg-white/90 p-2.5 lg:p-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.18em] lg:text-xs lg:tracking-[0.2em]">
                  {t('series.benefit')}
                </p>
                <EyeToggle
                  hidden={!monthSeriesVisibility.benefit}
                  onClick={() => toggleMonthSeries('benefit')}
                  label={t('series.benefit')}
                />
              </div>
              <div className={`mt-2 flex items-center gap-2 text-lg font-semibold sm:text-xl lg:text-2xl ${getBenefitClass(displaySummary.benefitCents)}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${monthBenefitDotClass}`} />
                <span>{formatCents(displaySummary.benefitCents)} EUR</span>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-5 rounded-2xl border border-ink/10 bg-white/90 p-3 sm:mt-6 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
              {t('labels.monthChart')}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <ChartTypeToggle value={monthChartType} onChange={setMonthChartType} />
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
          <div
            className={`mt-4 grid gap-4 ${showMonthBenefitSection ? 'lg:grid-cols-[1fr_220px]' : 'lg:grid-cols-1'}`}
          >
            <div className="h-[140px] sm:h-[220px] overflow-hidden" ref={monthChartContainerRef}>
              {hasMonthData ? (
                hasVisibleMonthBars ? (
                  isMonthLine ? (
                    <Line
                      data={monthChartData as ChartData<'line', Array<number | null>, string>}
                      options={monthChartOptionsWithClick as ChartOptions<'line'>}
                      ref={monthChartRef as RefObject<ChartInstance<'line', Array<number | null>, unknown>>}
                    />
                  ) : (
                    <Bar
                      data={monthChartData as ChartData<'bar', Array<number | null>, string>}
                      options={monthChartOptionsWithClick as ChartOptions<'bar'>}
                      ref={monthChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    {t('messages.seriesHidden')}
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  {t('messages.noChartData')}
                </div>
              )}
            </div>
            {showMonthBenefitSection ? (
              <div className="flex h-[140px] flex-col overflow-hidden rounded-xl border border-ink/10 bg-white/80 p-3 sm:h-[220px]">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.18em]">
                  {t('series.benefit')}
                  <span className={getBenefitClass(displaySummary.benefitCents)}>
                    {formatCents(displaySummary.benefitCents)} EUR
                  </span>
                </div>
                <div className="mt-2 flex-1 overflow-hidden" ref={benefitChartContainerRef}>
                  {hasMonthData ? (
                    showMonthBenefit ? (
                      isMonthLine ? (
                        <Line
                          data={benefitChartData as ChartData<'line', Array<number | null>, string>}
                          options={benefitChartOptions as ChartOptions<'line'>}
                          ref={benefitChartRef as RefObject<ChartInstance<'line', Array<number | null>, unknown>>}
                        />
                      ) : (
                        <Bar
                          data={benefitChartData as ChartData<'bar', Array<number | null>, string>}
                          options={benefitChartOptions as ChartOptions<'bar'>}
                          ref={benefitChartRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                        />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">
                        {t('messages.benefitHidden')}
                      </div>
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">
                      {t('messages.noChartData')}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="order-1 min-w-0 rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-6 lg:order-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink sm:text-2xl">{t('labels.saveMonth')}</h2>
          {isMobile ? (
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {monthValue.slice(5, 7)}/{monthValue.slice(0, 4)}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted sm:text-sm">
          {t('descriptions.monthSave')}
        </p>
        {readOnly ? (
          <div className="mt-3 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs">
            {t('messages.readOnlyActive')}
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="flex flex-col gap-2 text-sm text-muted">
            {t('series.income')}
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder={t('placeholders.amount')}
              value={form.income}
              onChange={onFormChange('income')}
              disabled={readOnly}
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-base text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted">
            {t('series.expense')}
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder={t('placeholders.amount')}
              value={form.expense}
              onChange={onFormChange('expense')}
              disabled={readOnly}
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-base text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted">
            {t('series.balance')}
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder={t('placeholders.amount')}
              value={form.balance}
              onChange={onFormChange('balance')}
              disabled={readOnly}
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-base text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted sm:text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={saving || readOnly}
            className="mt-2 rounded-full px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition bg-accent text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm sm:tracking-[0.18em] md:w-auto"
          >
            {saving ? t('actions.saving') : t('actions.saveMonth')}
          </button>
        </form>
        {error ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">
            <span>{error}</span>
            {onOpenSettings ? (
              <button
                type="button"
                onClick={onOpenSettings}
                className="rounded-full border border-red-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-700 transition hover:border-red-300 sm:text-xs sm:tracking-[0.18em]"
              >
                {t('actions.openSettings')}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
      <ChartModal
        open={chartModalOpen}
        title={t('labels.monthChart')}
        closeLabel={t('actions.close')}
        onClose={() => setChartModalOpen(false)}
        fullScreen={isMobile}
        requestLandscape={isMobile}
        rotateHint={t('messages.rotateDevice')}
      >
        <div className="h-full" ref={monthChartModalContainerRef}>
          {hasMonthData ? (
            hasVisibleMonthBars ? (
              isMonthLine ? (
                <Line
                  data={monthChartData as ChartData<'line', Array<number | null>, string>}
                  options={monthChartOptionsWithClick as ChartOptions<'line'>}
                  ref={monthChartModalRef as RefObject<ChartInstance<'line', Array<number | null>, unknown>>}
                />
              ) : (
                <Bar
                  data={monthChartData as ChartData<'bar', Array<number | null>, string>}
                  options={monthChartOptionsWithClick as ChartOptions<'bar'>}
                  ref={monthChartModalRef as RefObject<ChartInstance<'bar', Array<number | null>, unknown>>}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                {t('messages.seriesHidden')}
              </div>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              {t('messages.noChartData')}
            </div>
          )}
        </div>
      </ChartModal>
    </div>
  );
}
