import type { MonthlySeriesPoint, MonthlySummary } from '../db';
import { getMonthLabel } from '../utils/date';
import { formatCents } from '../utils/format';

type MonthlyRecapProps = {
  monthValue: string;
  summary: MonthlySummary;
  previousMonth: MonthlySeriesPoint | null;
  hasMonthData: boolean;
  locale: string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

type RecapMetricProps = {
  label: string;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  currentCents: number;
  previousCents: number;
  tone: 'positive' | 'negative' | 'neutral';
};

const formatAmount = (valueCents: number) => `${formatCents(valueCents)} EUR`;
const formatAbsoluteAmount = (valueCents: number) => formatAmount(Math.abs(valueCents));

function PeriodResultMetric({ label, valueCents }: { label: string; valueCents: number }) {
  const toneClass = valueCents > 0 ? 'text-benefit' : valueCents < 0 ? 'text-benefitNegative' : 'text-muted';
  return (
    <div className="rounded-xl bg-ink/[0.035] px-3 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <p className={`mt-1.5 font-semibold ${toneClass}`}>
        {valueCents > 0 ? '+' : ''}{formatAmount(valueCents)}
      </p>
    </div>
  );
}

function RecapMetric({
  label,
  currentPeriodLabel,
  previousPeriodLabel,
  currentCents,
  previousCents,
  tone
}: RecapMetricProps) {
  const deltaCents = currentCents - previousCents;
  const toneClass =
    tone === 'positive'
      ? 'text-benefit'
      : tone === 'negative'
        ? 'text-benefitNegative'
        : 'text-muted';

  return (
    <div className="rounded-xl bg-ink/[0.035] px-3 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <div className="mt-1.5">
        <p className={`font-semibold ${toneClass}`}>
          {deltaCents > 0 ? '+' : deltaCents < 0 ? '-' : ''}
          {formatAbsoluteAmount(deltaCents)}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          {currentPeriodLabel}: {formatAmount(currentCents)} · {previousPeriodLabel}: {formatAmount(previousCents)}
        </p>
      </div>
    </div>
  );
}

export function MonthlyRecap({
  monthValue,
  summary,
  previousMonth,
  hasMonthData,
  locale,
  t
}: MonthlyRecapProps) {
  const monthLabel = getMonthLabel(monthValue, locale, 'long');
  const monthWithYear = `${monthLabel} ${monthValue.slice(0, 4)}`;

  if (!hasMonthData) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
          {t('monthlyRecap.title', { month: monthWithYear })}
        </p>
        <p className="mt-3 text-sm text-muted">{t('monthlyRecap.noData', { month: monthWithYear })}</p>
      </section>
    );
  }

  if (!previousMonth) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
          {t('monthlyRecap.title', { month: monthWithYear })}
        </p>
        <p className="mt-3 text-sm text-muted">{t('monthlyRecap.noComparison')}</p>
      </section>
    );
  }

  const expenseDelta = summary.expenseCents - previousMonth.expenseCents;
  const benefitDelta = summary.benefitCents - previousMonth.benefitCents;
  const wealthDelta = summary.totalWealthCents - previousMonth.totalWealthCents;
  const previousMonthLabel = getMonthLabel(previousMonth.month, locale, 'long');
  const currentPeriodLabel = getMonthLabel(monthValue, locale).toUpperCase();
  const previousPeriodLabel = getMonthLabel(previousMonth.month, locale).toUpperCase();
  const investmentTracked =
    previousMonth.portfolioResultCents != null || summary.portfolioContributionCents != null;
  const investmentResultCents = investmentTracked
    ? summary.portfolioCents - previousMonth.portfolioCents - (summary.portfolioContributionCents ?? 0)
    : null;
  const headline =
    expenseDelta > 0
      ? t('monthlyRecap.expenseMore', { amount: formatAbsoluteAmount(expenseDelta), month: previousMonthLabel })
      : expenseDelta < 0
        ? t('monthlyRecap.expenseLess', { amount: formatAbsoluteAmount(expenseDelta), month: previousMonthLabel })
        : t('monthlyRecap.expenseSame', { month: previousMonthLabel });
  const status =
    benefitDelta > 0 && expenseDelta <= 0
      ? t('monthlyRecap.statusBetter')
      : benefitDelta < 0
        ? t('monthlyRecap.statusWorse')
        : t('monthlyRecap.statusSimilar');

  return (
    <section className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
        {t('monthlyRecap.title', { month: monthWithYear })}
      </p>
      <p className="mt-3 text-base font-semibold leading-6 text-ink">{headline}</p>
      <p className="mt-1 text-sm leading-5 text-muted">{status}</p>
      <div className={`mt-4 grid gap-2 border-t border-ink/10 pt-3 ${investmentResultCents == null ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        <RecapMetric
          label={t('monthlyRecap.expenses')}
          currentPeriodLabel={currentPeriodLabel}
          previousPeriodLabel={previousPeriodLabel}
          currentCents={summary.expenseCents}
          previousCents={previousMonth.expenseCents}
          tone={expenseDelta < 0 ? 'positive' : expenseDelta > 0 ? 'negative' : 'neutral'}
        />
        <RecapMetric
          label={t('monthlyRecap.savings')}
          currentPeriodLabel={currentPeriodLabel}
          previousPeriodLabel={previousPeriodLabel}
          currentCents={summary.benefitCents}
          previousCents={previousMonth.benefitCents}
          tone={benefitDelta > 0 ? 'positive' : benefitDelta < 0 ? 'negative' : 'neutral'}
        />
        <RecapMetric
          label={t('monthlyRecap.wealth')}
          currentPeriodLabel={currentPeriodLabel}
          previousPeriodLabel={previousPeriodLabel}
          currentCents={summary.totalWealthCents}
          previousCents={previousMonth.totalWealthCents}
          tone={wealthDelta > 0 ? 'positive' : wealthDelta < 0 ? 'negative' : 'neutral'}
        />
        {investmentResultCents != null ? (
          <PeriodResultMetric label={t('investment.monthResult')} valueCents={investmentResultCents} />
        ) : null}
      </div>
    </section>
  );
}
