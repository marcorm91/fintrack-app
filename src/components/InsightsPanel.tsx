import type { InsightComparison } from '../types/insights';
import { formatCents, getBenefitClass } from '../utils/format';

type InsightsPanelProps = {
  title: string;
  comparisons: InsightComparison[];
  emptyLabel: string;
  currentLabel: string;
  previousLabel: string;
  hasAnyData: boolean;
  showTitle?: boolean;
  containerClassName?: string;
};

const formatSignedCents = (valueCents: number) => {
  const sign = valueCents > 0 ? '+' : valueCents < 0 ? '-' : '';
  return `${sign}${formatCents(Math.abs(valueCents))}`;
};

const formatSignedPercent = (value: number) => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(1)}%`;
};

const getDeltaClass = (valueCents: number) => {
  if (valueCents === 0) {
    return 'text-muted';
  }
  return getBenefitClass(valueCents);
};

export function InsightsPanel({
  title,
  comparisons,
  emptyLabel,
  currentLabel,
  previousLabel,
  hasAnyData,
  showTitle = true,
  containerClassName
}: InsightsPanelProps) {
  const sectionClassName =
    containerClassName ?? 'rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-card';
  if (!hasAnyData) {
    return (
      <section className={sectionClassName}>
        {showTitle ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
        ) : null}
        <p className="mt-3 text-sm text-muted">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section className={sectionClassName}>
      {showTitle ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {comparisons.map((comparison) => (
          <div key={comparison.key} className="rounded-xl border border-ink/10 bg-white/90 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {comparison.label}
            </p>
            {comparison.hasData ? (
              <div className="mt-3 grid gap-2 text-sm">
                {comparison.deltas.map((delta) => (
                  <div
                    key={delta.key}
                    className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 odd:bg-ink/5"
                  >
                    <span className="text-muted">{delta.label}</span>
                    <div className="text-right">
                      <div className={`font-semibold ${getDeltaClass(delta.deltaCents)}`}>
                        {formatSignedCents(delta.deltaCents)} EUR
                        {delta.percentChange !== null ? ` (${formatSignedPercent(delta.percentChange)})` : ''}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {currentLabel}: {formatCents(delta.currentCents)} EUR · {previousLabel}:{' '}
                        {formatCents(delta.previousCents)} EUR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">{emptyLabel}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
