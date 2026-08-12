import type { AllYearsPoint, YearTotals } from '../hooks/useSeriesDerived';
import { formatCents } from '../utils/format';

type YearRecapProps = {
  yearValue: string;
  yearTotals: YearTotals;
  comparisonYears: string[];
  comparisonYear: AllYearsPoint | null;
  comparisonYearValue: string;
  setComparisonYearValue: (value: string) => void;
  hasYearData: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

type RecapMetricProps = {
  label: string;
  currentCents: number;
  previousCents: number;
  tone: 'positive' | 'negative' | 'neutral';
};

const formatAmount = (valueCents: number) => `${formatCents(valueCents)} EUR`;
const formatAbsoluteAmount = (valueCents: number) => formatAmount(Math.abs(valueCents));

function RecapMetric({ label, currentCents, previousCents, tone }: RecapMetricProps) {
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
          {formatAmount(currentCents)} · {formatAmount(previousCents)}
        </p>
      </div>
    </div>
  );
}

export function YearRecap({
  yearValue,
  yearTotals,
  comparisonYears,
  comparisonYear,
  comparisonYearValue,
  setComparisonYearValue,
  hasYearData,
  t
}: YearRecapProps) {
  if (!hasYearData) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
          {t('yearRecap.title', { year: yearValue })}
        </p>
        <p className="mt-3 text-sm text-muted">{t('yearRecap.noData', { year: yearValue })}</p>
      </section>
    );
  }

  if (!comparisonYear) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
          {t('yearRecap.title', { year: yearValue })}
        </p>
        <p className="mt-3 text-sm text-muted">{t('yearRecap.noComparison')}</p>
      </section>
    );
  }

  const expenseDelta = yearTotals.expenseCents - comparisonYear.expenseCents;
  const savingsDelta = yearTotals.benefitCents - comparisonYear.benefitCents;
  const wealthDelta = yearTotals.totalWealthCents - comparisonYear.totalWealthCents;
  const savingsHeadline =
    savingsDelta > 0
      ? t('yearRecap.savingsMore', { amount: formatAbsoluteAmount(savingsDelta), year: comparisonYear.year })
      : savingsDelta < 0
        ? t('yearRecap.savingsLess', { amount: formatAbsoluteAmount(savingsDelta), year: comparisonYear.year })
        : t('yearRecap.savingsSame', { year: comparisonYear.year });
  const wealthHeadline =
    wealthDelta > 0
      ? t('yearRecap.wealthMore', { amount: formatAbsoluteAmount(wealthDelta), year: comparisonYear.year })
      : wealthDelta < 0
        ? t('yearRecap.wealthLess', { amount: formatAbsoluteAmount(wealthDelta), year: comparisonYear.year })
        : t('yearRecap.wealthSame', { year: comparisonYear.year });

  return (
    <section className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.2em]">
            {t('yearRecap.title', { year: yearValue })}
          </p>
          <p className="mt-3 text-base font-semibold leading-6 text-ink">{savingsHeadline}</p>
          <p className="mt-1 text-sm leading-5 text-muted">{wealthHeadline}</p>
        </div>
        <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:min-w-36 sm:text-right">
          {t('yearRecap.compareWith', { year: yearValue })}
          <select
            value={comparisonYearValue}
            onChange={(event) => setComparisonYearValue(event.target.value)}
            className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-left text-sm font-normal normal-case tracking-normal text-ink shadow-sm focus:border-accent focus:outline-none sm:text-right"
          >
            {comparisonYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 grid gap-2 border-t border-ink/10 pt-3 lg:grid-cols-3">
        <RecapMetric
          label={t('yearRecap.expenses')}
          currentCents={yearTotals.expenseCents}
          previousCents={comparisonYear.expenseCents}
          tone={expenseDelta < 0 ? 'positive' : expenseDelta > 0 ? 'negative' : 'neutral'}
        />
        <RecapMetric
          label={t('yearRecap.savings')}
          currentCents={yearTotals.benefitCents}
          previousCents={comparisonYear.benefitCents}
          tone={savingsDelta > 0 ? 'positive' : savingsDelta < 0 ? 'negative' : 'neutral'}
        />
        <RecapMetric
          label={t('yearRecap.wealth')}
          currentCents={yearTotals.totalWealthCents}
          previousCents={comparisonYear.totalWealthCents}
          tone={wealthDelta > 0 ? 'positive' : wealthDelta < 0 ? 'negative' : 'neutral'}
        />
      </div>
    </section>
  );
}
