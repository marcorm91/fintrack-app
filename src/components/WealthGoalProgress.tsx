import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMonthLabel, getMonthValue } from '../utils/date';
import { formatCents } from '../utils/format';
import { getWealthGoalProgress, type WealthGoal } from '../utils/wealthGoal';
import { WealthGoalDialog } from './WealthGoalDialog';

export function WealthGoalProgress({ goal, currentCents, asOfMonth, loading, readOnly, onSave }: {
  goal: WealthGoal | null;
  currentCents: number;
  asOfMonth: string | null;
  loading: boolean;
  readOnly: boolean;
  onSave: (goal: WealthGoal | null) => Promise<void>;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  const currentMonth = getMonthValue(new Date());
  const referenceMonth = asOfMonth ?? currentMonth;
  const progress = goal ? getWealthGoalProgress(goal, currentCents, referenceMonth) : null;
  const percent = progress ? new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(progress.visualPercent) : '';
  return (
    <>
      <div className="relative mt-4 rounded-xl border border-ink/5 bg-[#f7fff9] p-3 sm:p-4" aria-busy={loading}>
        <button type="button" onClick={() => setOpen(true)} disabled={loading || readOnly}
          aria-label={t(goal ? 'wealthGoal.edit' : 'wealthGoal.create')} aria-describedby={`${id}-details`}
          className="absolute inset-0 z-10 w-full rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default" />
        <div id={`${id}-details`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink sm:text-base">{t('wealthGoal.title')}{goal ? ` · ${formatCents(goal.targetAmountCents)} EUR` : ''}</p>
              <p className="mt-1 text-xs text-muted">{goal ? `${getMonthLabel(goal.targetMonth, i18n.language, 'long')} ${goal.targetMonth.slice(0, 4)}` : t('wealthGoal.empty')}</p>
            </div>
            {!readOnly && <span aria-hidden="true" className="text-xl text-ink">›</span>}
          </div>
          {progress && <>
            <div className="mt-3 flex items-center gap-3">
              <div role="progressbar" aria-label={t('wealthGoal.progress')} aria-valuemin={0} aria-valuemax={100}
                aria-valuenow={progress.visualPercent} aria-valuetext={`${percent} %`}
                className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-benefit" style={{ width: `${progress.visualPercent}%` }} />
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink">{percent} %</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <p className="text-muted">{t('wealthGoal.remaining')}<span className="mt-1 block font-semibold text-ink">{formatCents(progress.remainingCents)} EUR</span></p>
              <p className="border-l border-ink/5 pl-3 text-muted">{t('wealthGoal.needed')}<span className="mt-1 block font-semibold text-ink">{progress.monthlyCents === null ? t('wealthGoal.due') : t('wealthGoal.perMonth', { amount: formatCents(progress.monthlyCents) })}</span></p>
            </div>
            {progress.reached && <p className="mt-2 text-sm font-semibold text-ink">{t('wealthGoal.reached')}</p>}
          </>}
        </div>
      </div>
      {open && <WealthGoalDialog goal={goal} minimumMonth={referenceMonth > currentMonth ? referenceMonth : currentMonth}
        readOnly={readOnly} onSave={onSave} onClose={() => setOpen(false)} />}
    </>
  );
}
