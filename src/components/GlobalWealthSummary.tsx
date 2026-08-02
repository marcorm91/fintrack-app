import { useTranslation } from 'react-i18next';
import { formatCents } from '../utils/format';

type GlobalWealthSummaryProps = {
  totalWealthCents: number;
  balanceCents: number;
  portfolioCents: number;
  hasInvestmentPortfolio: boolean;
};

function getTodayDateLabel() {
  const date = new Date();
  const dayText = String(date.getDate()).padStart(2, '0');
  const monthText = String(date.getMonth() + 1).padStart(2, '0');
  return `${dayText}/${monthText}/${date.getFullYear()}`;
}

export function GlobalWealthSummary({
  totalWealthCents,
  balanceCents,
  portfolioCents,
  hasInvestmentPortfolio
}: GlobalWealthSummaryProps) {
  const { t } = useTranslation();
  const dateLabel = getTodayDateLabel();

  return (
    <section className="mt-4 rounded-2xl border border-ink/5 bg-white/95 p-4 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted sm:text-xs">
            {t(hasInvestmentPortfolio ? 'series.totalWealth' : 'series.balance')} {t('labels.asOf')} {dateLabel}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-semibold text-ink sm:text-3xl">
              {formatCents(totalWealthCents)} EUR
            </p>
          </div>
        </div>
        <div className={`grid gap-2 text-xs text-muted ${hasInvestmentPortfolio ? 'grid-cols-2 sm:min-w-[320px]' : 'grid-cols-1 sm:min-w-[160px]'}`}>
          <div className="rounded-xl border border-ink/5 bg-[#f7fff9] px-3 py-2">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-balance" />
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
        </div>
      </div>
    </section>
  );
}
