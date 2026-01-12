import type { FormState, SeriesKey, ChartType } from '../../types';
import type { MonthlySummary } from '../../db';
import type { ActiveElement, ChartData, ChartEvent, ChartOptions } from 'chart.js';
import type { RefObject } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { ChartTypeToggle } from '../../components/ChartTypeToggle';
import { MonthPicker } from '../../components/MonthPicker';
import { EyeToggle } from '../../components/EyeToggle';
import { ChevronIcon } from '../../components/icons';
import { useChartResize, type ChartInstance } from '../../hooks/useChartResize';
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
  error
}: MonthViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { chartRef: monthChartRef, containerRef: monthChartContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const { chartRef: benefitChartRef, containerRef: benefitChartContainerRef } = useChartResize<
    'bar' | 'line',
    Array<number | null>,
    string
  >();
  const showMonthBenefitSection = !isCurrentMonth || hasMonthData;
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <section className="min-w-0 rounded-2xl border border-ink/10 bg-white/80 p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent2">{t('labels.monthSummary')}</p>
            <h2 className="text-2xl font-semibold text-ink">
              {getMonthLabel(monthValue, locale)} {monthValue.slice(0, 4)}
            </h2>
          </div>
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
              className={`rounded-xl border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition ${
                isCurrentMonth
                  ? 'cursor-default opacity-60'
                  : ' hover:border-accent hover:text-ink'
              }`}
            >
              {t('actions.gotoCurrentMonth')}
            </button>
          </div>
          <div aria-hidden="true">
          </div>
        </div>
        <div
          className={`mt-6 grid gap-4 md:grid-cols-2 ${showMonthBenefitSection ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}
        >
          <div className="rounded-xl border border-ink/10 bg-white/90 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">{t('series.income')}</p>
              <EyeToggle
                hidden={!monthSeriesVisibility.income}
                onClick={() => toggleMonthSeries('income')}
                label={t('series.income')}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-ink">
              <span className="h-2.5 w-2.5 rounded-full bg-income" />
              <span>{formatCents(displaySummary.incomeCents)} EUR</span>
            </div>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/90 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">{t('series.expense')}</p>
              <EyeToggle
                hidden={!monthSeriesVisibility.expense}
                onClick={() => toggleMonthSeries('expense')}
                label={t('series.expense')}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-ink">
              <span className="h-2.5 w-2.5 rounded-full bg-expense" />
              <span>{formatCents(displaySummary.expenseCents)} EUR</span>
            </div>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/90 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">{t('series.balance')}</p>
              <EyeToggle
                hidden={!monthSeriesVisibility.balance}
                onClick={() => toggleMonthSeries('balance')}
                label={t('series.balance')}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-ink">
              <span className="h-2.5 w-2.5 rounded-full bg-balance" />
              <span>{formatCents(displaySummary.balanceCents)} EUR</span>
            </div>
          </div>
          {showMonthBenefitSection ? (
            <div className="rounded-xl border border-ink/10 bg-white/90 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{t('series.benefit')}</p>
                <EyeToggle
                  hidden={!monthSeriesVisibility.benefit}
                  onClick={() => toggleMonthSeries('benefit')}
                  label={t('series.benefit')}
                />
              </div>
              <div className={`mt-2 flex items-center gap-2 text-2xl font-semibold ${getBenefitClass(displaySummary.benefitCents)}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${monthBenefitDotClass}`} />
                <span>{formatCents(displaySummary.benefitCents)} EUR</span>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{t('labels.monthChart')}</p>
            <div className="flex items-center gap-3">
              <ChartTypeToggle value={monthChartType} onChange={setMonthChartType} />
              <span className="text-xs uppercase tracking-[0.2em] text-muted">
                {getMonthLabel(monthValue, locale)} {monthValue.slice(0, 4)}
              </span>
            </div>
          </div>
          <div
            className={`mt-4 grid gap-4 ${showMonthBenefitSection ? 'lg:grid-cols-[1fr_220px]' : 'lg:grid-cols-1'}`}
          >
            <div className="h-[220px]" ref={monthChartContainerRef}>
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
              <div className="flex h-[220px] flex-col rounded-xl border border-ink/10 bg-white/80 p-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
                  {t('series.benefit')}
                  <span className={getBenefitClass(displaySummary.benefitCents)}>
                    {formatCents(displaySummary.benefitCents)} EUR
                  </span>
                </div>
                <div className="mt-2 flex-1" ref={benefitChartContainerRef}>
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

      <section className="min-w-0 rounded-2xl border border-ink/10 bg-white/80 p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">{t('labels.saveMonth')}</h2>
        <p className="mt-2 text-sm text-muted">
          {t('descriptions.monthSave')}
        </p>
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
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
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
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
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
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition md:w-auto bg-accent text-white shadow-md"
          >
            {saving ? t('actions.saving') : t('actions.saveMonth')}
          </button>
        </form>
        {error ? <p className="mt-4 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      </section>
    </div>
  );
}
