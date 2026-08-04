import type { FormState, SeriesKey } from '../../types';
import type { MonthlySummary } from '../../db';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { MonthPicker } from '../../components/MonthPicker';
import { ChevronIcon, PlusIcon } from '../../components/icons';
import { useIsMobile } from '../../hooks/useIsMobile';
import { formatCents, getBenefitClass } from '../../utils/format';
import { getMonthLabel, shiftMonthValue } from '../../utils/date';

const MONTH_INPUT_COLORS = {
  income: '#70e3b6',
  expense: '#ff6b8f'
};

type MonthlyInputMixItem = {
  key: Exclude<SeriesKey, 'benefit' | 'totalWealth'>;
  label: string;
  cents: number;
  color: string;
};

function getDonutGradient(items: MonthlyInputMixItem[]) {
  const total = items.reduce((sum, item) => sum + Math.abs(item.cents), 0);
  if (total <= 0) {
    return 'conic-gradient(#e8eef4 0deg 360deg)';
  }

  let cursor = 0;
  const stops = items.map((item) => {
    const next = cursor + (Math.abs(item.cents) / total) * 360;
    const stop = `${item.color} ${cursor.toFixed(2)}deg ${next.toFixed(2)}deg`;
    cursor = next;
    return stop;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

function getDonutTooltipPosition(items: MonthlyInputMixItem[], key: MonthlyInputMixItem['key']) {
  const total = items.reduce((sum, item) => sum + Math.abs(item.cents), 0);
  if (total <= 0) {
    return key === 'income' ? { left: '68%', top: '26%' } : { left: '32%', top: '74%' };
  }

  let cursor = 0;
  for (const item of items) {
    const sweep = (Math.abs(item.cents) / total) * 360;
    const midpoint = cursor + sweep / 2;
    if (item.key === key) {
      const radians = (midpoint * Math.PI) / 180;
      const radius = 39;
      return {
        left: `${50 + Math.sin(radians) * radius}%`,
        top: `${50 - Math.cos(radians) * radius}%`
      };
    }
    cursor += sweep;
  }

  return { left: '50%', top: '50%' };
}

function getDonutItemPercent(items: MonthlyInputMixItem[], cents: number) {
  const total = items.reduce((sum, item) => sum + Math.abs(item.cents), 0);
  if (total <= 0) {
    return '0%';
  }
  return `${Math.round((Math.abs(cents) / total) * 100)}%`;
}

type MonthViewProps = {
  monthValue: string;
  setMonthValue: (value: string | ((prev: string) => string)) => void;
  currentMonthValue: string;
  isCurrentMonth: boolean;
  displaySummary: MonthlySummary;
  form: FormState;
  onFormChange: (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  error: string | null;
  readOnly?: boolean;
  hasInvestmentPortfolio: boolean;
  onOpenSettings?: () => void;
  onMobileFormOpenChange?: (open: boolean) => void;
};

export function MonthView({
  monthValue,
  setMonthValue,
  currentMonthValue,
  isCurrentMonth,
  displaySummary,
  form,
  onFormChange,
  onSubmit,
  saving,
  error,
  readOnly = false,
  hasInvestmentPortfolio,
  onOpenSettings,
  onMobileFormOpenChange
}: MonthViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const isMobile = useIsMobile();
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [mobileFormClosing, setMobileFormClosing] = useState(false);
  const [sheetTouchStartY, setSheetTouchStartY] = useState<number | null>(null);
  const closeSheetTimerRef = useRef<number | null>(null);
  const monthlyFlowMix = useMemo<MonthlyInputMixItem[]>(
    () => [
      {
        key: 'income',
        label: t('series.income'),
        cents: displaySummary.incomeCents,
        color: MONTH_INPUT_COLORS.income
      },
      {
        key: 'expense',
        label: t('series.expense'),
        cents: displaySummary.expenseCents,
        color: MONTH_INPUT_COLORS.expense
      }
    ],
    [displaySummary.expenseCents, displaySummary.incomeCents, t]
  );
  const donutItems = monthlyFlowMix.filter((item) => Math.abs(item.cents) > 0);
  const donutGradient = getDonutGradient(donutItems);
  const incomeItem = monthlyFlowMix[0];
  const expenseItem = monthlyFlowMix[1];
  const incomePercent = getDonutItemPercent(monthlyFlowMix, incomeItem.cents);
  const expensePercent = getDonutItemPercent(monthlyFlowMix, expenseItem.cents);
  const incomeTooltipPosition = getDonutTooltipPosition(monthlyFlowMix, 'income');
  const expenseTooltipPosition = getDonutTooltipPosition(monthlyFlowMix, 'expense');
  useEffect(() => {
    onMobileFormOpenChange?.(mobileFormOpen);
    return () => onMobileFormOpenChange?.(false);
  }, [mobileFormOpen, onMobileFormOpenChange]);

  useEffect(() => {
    if (!mobileFormOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [mobileFormOpen]);

  useEffect(
    () => () => {
      if (closeSheetTimerRef.current !== null) {
        window.clearTimeout(closeSheetTimerRef.current);
      }
    },
    []
  );

  const openMobileForm = () => {
    if (closeSheetTimerRef.current !== null) {
      window.clearTimeout(closeSheetTimerRef.current);
      closeSheetTimerRef.current = null;
    }
    setMobileFormClosing(false);
    setMobileFormOpen(true);
  };

  const closeMobileForm = () => {
    if (!mobileFormOpen || mobileFormClosing) {
      return;
    }

    setMobileFormClosing(true);
    closeSheetTimerRef.current = window.setTimeout(() => {
      setMobileFormOpen(false);
      setMobileFormClosing(false);
      closeSheetTimerRef.current = null;
    }, 280);
  };

  const handleSheetTouchEnd = (clientY: number) => {
    if (sheetTouchStartY !== null && clientY - sheetTouchStartY > 70) {
      closeMobileForm();
    }
    setSheetTouchStartY(null);
  };
  const formContent = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink sm:text-2xl">{t('labels.saveMonth')}</h2>
        {isMobile ? (
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {monthValue.slice(5, 7)}/{monthValue.slice(0, 4)}
          </span>
        ) : null}
      </div>
      {!isMobile ? <p className="mt-2 text-sm text-muted">{t('descriptions.monthSave')}</p> : null}
      {readOnly ? (
        <div className="mt-3 rounded-xl border border-ink/5 bg-ink/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:text-xs">
          {t('messages.readOnlyActive')}
        </div>
      ) : null}
      <form onSubmit={onSubmit} className={isMobile ? 'mt-3 grid gap-3' : 'mt-6 grid gap-4'}>
        <fieldset className={`border border-income/15 bg-[#f7fff9] shadow-sm ${isMobile ? 'rounded-xl p-2' : 'rounded-2xl p-3'}`}>
          <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
            {t('labels.monthCashFlow')}
          </legend>
          <div className={`grid grid-cols-2 ${isMobile ? 'mt-2 gap-2' : 'mt-3 gap-3'}`}>
            <label className={`rounded-xl border border-ink/5 bg-white/90 text-muted ${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-income" />
                {t('series.income')}
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder={t('placeholders.amount')}
                value={form.income}
                onChange={onFormChange('income')}
                disabled={readOnly}
                className={`mt-2 w-full rounded-xl border border-ink/5 bg-white text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'}`}
              />
            </label>
            <label className={`rounded-xl border border-ink/5 bg-white/90 text-muted ${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-expense" />
                {t('series.expense')}
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder={t('placeholders.amount')}
                value={form.expense}
                onChange={onFormChange('expense')}
                disabled={readOnly}
                className={`mt-2 w-full rounded-xl border border-ink/5 bg-white text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'}`}
              />
            </label>
          </div>
        </fieldset>
        <fieldset className={`border border-balance/15 bg-[#f7fbff] shadow-sm ${isMobile ? 'rounded-xl p-2' : 'rounded-2xl p-3'}`}>
          <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
            {t('labels.wealth')}
          </legend>
          <div className={`grid ${isMobile ? 'mt-2 gap-2' : 'mt-3 gap-3'} ${hasInvestmentPortfolio ? 'grid-cols-2' : ''}`}>
            <label className={`rounded-xl border border-ink/5 bg-white/90 text-muted ${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-balance" />
                {t('labels.closingBalanceInput')}
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder={t('placeholders.amount')}
                value={form.balance}
                onChange={onFormChange('balance')}
                disabled={readOnly}
                className={`mt-2 w-full rounded-xl border border-ink/5 bg-white text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'}`}
              />
            </label>
            {hasInvestmentPortfolio ? (
              <label className={`rounded-xl border border-ink/5 bg-white/90 text-muted ${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-portfolio" />
                  {t('series.portfolio')}
                </span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder={t('placeholders.amount')}
                  value={form.portfolio}
                  onChange={onFormChange('portfolio')}
                  disabled={readOnly}
                  className={`mt-2 w-full rounded-xl border border-ink/5 bg-white text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'}`}
                />
              </label>
            ) : null}
          </div>
        </fieldset>
        <label className={`rounded-xl border border-ink/10 bg-white/90 text-sm text-muted ${isMobile ? 'p-2' : 'p-3'}`}>
          <span className="flex items-center justify-between gap-2">
            <span>{t('labels.monthNote')}</span>
            <span className="text-[10px] tabular-nums text-muted">{form.note.length}/500</span>
          </span>
          <textarea
            rows={isMobile ? 2 : 3}
            maxLength={500}
            placeholder={t('placeholders.monthNote')}
            value={form.note}
            onChange={onFormChange('note')}
            disabled={readOnly}
            className={`mt-2 w-full resize-y rounded-xl border border-ink/5 bg-white px-3 text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted ${isMobile ? 'min-h-14 py-1.5 text-sm' : 'py-2 text-sm'}`}
          />
        </label>
        <button
          type="submit"
          disabled={saving || readOnly}
          className="btn btn-primary sticky bottom-0 z-10 mt-2 py-3 text-[11px] shadow-card sm:static sm:text-sm sm:shadow-none md:w-auto"
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
              className="btn btn-danger px-3 py-1 text-[10px] sm:text-xs"
            >
              {t('actions.openSettings')}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
  const mobileControls = isMobile ? (
    <>
      <button
        type="button"
        onClick={openMobileForm}
        className="btn btn-primary mobile-fab fixed right-4 z-30 grid h-12 w-12 place-items-center rounded-full p-0 shadow-card"
        style={{ bottom: 'calc(var(--app-safe-bottom) + 5.25rem)' }}
        aria-label={t('labels.saveMonth')}
        title={t('labels.saveMonth')}
      >
        <PlusIcon />
      </button>
      {mobileFormOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink/35"
          style={{
            opacity: mobileFormClosing ? 0 : 1,
            transition: 'opacity 280ms ease'
          }}
          onClick={closeMobileForm}
        >
          <div
            className="max-h-[92vh] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-ink/10 bg-white p-3 pb-[calc(var(--app-safe-bottom)+0.75rem)] shadow-card"
            style={{
              transform: mobileFormClosing ? 'translateY(100%)' : 'translateY(0)',
              transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform'
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="mx-auto mb-3 block h-1.5 w-12 touch-none rounded-full bg-ink/15"
              onClick={closeMobileForm}
              onTouchStart={(event) => setSheetTouchStartY(event.touches[0]?.clientY ?? null)}
              onTouchEnd={(event) => handleSheetTouchEnd(event.changedTouches[0]?.clientY ?? 0)}
              aria-label={t('actions.close')}
              title={t('actions.close')}
            />
            {formContent}
          </div>
        </div>
      ) : null}
    </>
  ) : null;
  return (
    <div>
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="order-1 min-w-0 rounded-2xl border border-ink/5 bg-white/95 p-4 shadow-card sm:p-6 lg:order-1">
          <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-wrap items-start justify-between'}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-accent2 sm:text-xs sm:tracking-[0.28em]">
              {t('labels.monthSummary')}
            </p>
            <h2 className="text-xl font-semibold text-ink sm:text-2xl mt-2">
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
                  className={`btn btn-neutral text-muted hover:text-ink ${isMobile ? 'btn-icon' : 'btn-icon-sm'}`}
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
                  className={`btn btn-neutral text-muted hover:text-ink ${isMobile ? 'btn-icon' : 'btn-icon-sm'}`}
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setMonthValue(currentMonthValue)}
                disabled={isCurrentMonth}
                className={`btn btn-neutral w-full px-3 text-[9px] tracking-[0.14em] ${
                  isCurrentMonth ? 'cursor-default opacity-60' : ' hover:border-ink/25 hover:text-ink'
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
                    className="btn btn-neutral btn-icon-sm text-muted hover:text-ink"
                  >
                    <ChevronIcon direction="left" />
                  </button>
                  <MonthPicker label={t('labels.currentMonth')} value={monthValue} onChange={setMonthValue} />
                  <button
                    type="button"
                    onClick={() => setMonthValue((prev) => shiftMonthValue(prev, 1))}
                    aria-label={t('actions.nextMonth')}
                    title={t('actions.nextMonth')}
                    className="btn btn-neutral btn-icon-sm text-muted hover:text-ink"
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMonthValue(currentMonthValue)}
                  disabled={isCurrentMonth}
                  className={`btn btn-neutral tracking-[0.14em] ${
                    isCurrentMonth
                      ? 'cursor-default opacity-60'
                      : ' hover:border-ink/25 hover:text-ink'
                  }`}
                >
                  {t('actions.gotoCurrentMonth')}
                </button>
              </div>
              <div aria-hidden="true"></div>
            </>
          )}
          </div>
          <div className="mt-5">
            <div className="rounded-2xl border border-ink/5 bg-[#f7fff9] p-4 shadow-card">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted sm:text-xs">
                {t('labels.monthCashFlow')}
              </p>
              <div className="mt-4 grid place-items-center">
                <div className="relative h-[248px] w-full max-w-[360px] sm:h-[340px]">
                  {!isMobile ? (
                    <>
                      <div
                        className="pointer-events-none absolute z-10 w-[132px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ink/5 bg-white/95 px-3 py-2 text-xs text-muted shadow-card"
                        style={incomeTooltipPosition}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-income" />
                          {incomeItem.label}
                        </span>
                        <p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-ink">
                          {formatCents(incomeItem.cents)} EUR <span className="text-muted">({incomePercent})</span>
                        </p>
                      </div>
                      <div
                        className="pointer-events-none absolute z-10 w-[132px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ink/5 bg-white/95 px-3 py-2 text-xs text-muted shadow-card"
                        style={expenseTooltipPosition}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-expense" />
                          {expenseItem.label}
                        </span>
                        <p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-ink">
                          {formatCents(expenseItem.cents)} EUR <span className="text-muted">({expensePercent})</span>
                        </p>
                      </div>
                    </>
                  ) : null}
                  <div className="absolute left-1/2 top-1/2 grid h-52 w-52 -translate-x-1/2 -translate-y-1/2 place-items-center sm:h-64 sm:w-64">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(33,48,71,0.04)]"
                      style={{ background: donutGradient }}
                    />
                    <div className="absolute inset-[15%] rounded-full bg-[#f7fff9] shadow-[0_12px_34px_-28px_rgba(33,48,71,0.9)]" />
                    <div className="relative max-w-[68%] px-3 text-center">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{t('series.benefit')}</p>
                      <p className={`mt-1 break-words text-xl font-semibold leading-tight sm:text-2xl ${getBenefitClass(displaySummary.benefitCents)}`}>
                        {formatCents(displaySummary.benefitCents)} EUR
                      </p>
                    </div>
                  </div>
                </div>
                {isMobile ? (
                  <div className="mt-3 grid w-full grid-cols-2 gap-2">
                    <div className="min-w-0 rounded-xl border border-ink/5 bg-white/95 px-3 py-2 text-xs text-muted shadow-card">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-income" />
                        {incomeItem.label}
                      </span>
                      <p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-ink">
                        {formatCents(incomeItem.cents)} EUR <span className="text-muted">({incomePercent})</span>
                      </p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-ink/5 bg-white/95 px-3 py-2 text-xs text-muted shadow-card">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-expense" />
                        {expenseItem.label}
                      </span>
                      <p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-ink">
                        {formatCents(expenseItem.cents)} EUR <span className="text-muted">({expensePercent})</span>
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {displaySummary.note ? (
            <div className="mt-4 rounded-xl border border-accent/15 bg-accent/5 px-4 py-3 text-sm text-ink">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent2">
                {t('labels.monthNote')}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">{displaySummary.note}</p>
            </div>
          ) : null}
        </section>

        <section className="order-2 hidden min-w-0 rounded-2xl border border-ink/5 bg-white/95 p-4 shadow-card sm:block sm:p-6 lg:order-2">
          {formContent}
        </section>
      </div>

      {mobileControls ? createPortal(mobileControls, document.body) : null}
    </div>
  );
}
