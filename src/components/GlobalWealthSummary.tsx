import type { WealthGoal } from '../utils/wealthGoal';
import { WealthGoalProgress } from './WealthGoalProgress';
import { useTranslation } from 'react-i18next';
import { formatCents } from '../utils/format';
import { getMonthLabel } from '../utils/date';

type GlobalWealthSummaryProps = {
  totalWealthCents: number;
  balanceCents: number;
  portfolioCents: number;
  hasInvestmentPortfolio: boolean;
  asOfMonth: string | null;
  displayMonth: string;
  goal: WealthGoal | null;
  goalLoading: boolean;
  readOnly: boolean;
  onSaveGoal: (goal: WealthGoal | null) => Promise<void>;
};

export function GlobalWealthSummary({
  totalWealthCents,
  balanceCents,
  portfolioCents,
  hasInvestmentPortfolio,
  asOfMonth, displayMonth, goal, goalLoading, readOnly, onSaveGoal
}: GlobalWealthSummaryProps) {
  const { t, i18n } = useTranslation();
  const dateLabel = t('dashboard.asOf', { month: getMonthLabel(displayMonth, i18n.language, 'long'), year: displayMonth.slice(0, 4) });
  const showComposition = hasInvestmentPortfolio && totalWealthCents > 0 && balanceCents >= 0 && portfolioCents >= 0;
  const cashPercent = showComposition ? Math.round(balanceCents / totalWealthCents * 100) : 0;

  return (
    <>
    <section className="dashboard-card wealth-overview">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted sm:text-xs">
            {t(hasInvestmentPortfolio ? 'series.totalWealth' : 'series.balance')}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="wealth-value font-semibold text-ink">
              {formatCents(totalWealthCents)} EUR
            </p>
          </div>
          <p className="mt-1 text-sm text-muted">{dateLabel}</p>
        </div>
        <div className={`grid gap-2 text-sm text-muted ${hasInvestmentPortfolio ? 'grid-cols-2 sm:min-w-[320px]' : 'grid-cols-1 sm:min-w-[160px]'}`}>
          <div className="rounded-xl border border-ink/5 bg-[#f7fff9] px-3 py-2">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-benefit" />
              {t('series.balance')}
            </span>
            <p className="mt-1 font-semibold text-ink">{formatCents(balanceCents)} EUR</p>
          </div>
          {hasInvestmentPortfolio ? (
            <div className="rounded-xl border border-ink/5 bg-[#f7fff9] px-3 py-2">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-portfolio" />
                {t('series.portfolio')}
              </span>
              <p className="mt-1 font-semibold text-ink">{formatCents(portfolioCents)} EUR</p>
            </div>
          ) : null}
          {showComposition && <div className="col-span-2 hidden lg:block" aria-hidden="true">
            <div className="flex h-2 overflow-hidden rounded-full bg-portfolio"><span className="bg-benefit" style={{ width: `${cashPercent}%` }} /></div>
            <div className="mt-1 flex justify-between text-xs"><span>{cashPercent} %</span><span>{100 - cashPercent} %</span></div>
          </div>}
        </div>
      </div>
    </section>
      <WealthGoalProgress goal={goal} loading={goalLoading} readOnly={readOnly} onSave={onSaveGoal} currentCents={totalWealthCents} asOfMonth={asOfMonth} />
    </>
  );
}
