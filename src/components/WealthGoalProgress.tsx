import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMonthLabel, getMonthValue } from '../utils/date';
import { formatCents } from '../utils/format';
import { getWealthGoalProgress, type WealthGoal } from '../utils/wealthGoal';
import { GoalCalendarIcon, PencilIcon, PlusIcon, TargetIcon } from './icons';
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
      <div className="mt-3 border-t border-ink/10 bg-white px-1 pb-1 pt-3" aria-busy={loading}>
        <div id={`${id}-details`}>
          <div className={`flex gap-3 ${goal ? 'items-start' : 'flex-wrap items-center'}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-benefit/10 text-benefit sm:h-11 sm:w-11" aria-hidden="true">
              <TargetIcon />
            </span>
            <div id={`${id}-summary`} className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-ink">{t('wealthGoal.title')}</p>
              {goal ? (
                <>
                  <p className="mt-0.5 break-words text-lg font-semibold leading-tight text-ink sm:text-xl">{formatCents(goal.targetAmountCents)} EUR</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <GoalCalendarIcon />
                    <span className="capitalize">{getMonthLabel(goal.targetMonth, i18n.language, 'long')} {goal.targetMonth.slice(0, 4)}</span>
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-muted">{t('wealthGoal.empty')}</p>
              )}
            </div>
            {!readOnly && (goal ? (
              <button type="button" onClick={() => setOpen(true)} disabled={loading}
                aria-label={t('wealthGoal.edit')} aria-describedby={`${id}-summary`} aria-haspopup="dialog"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 text-ink hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50">
                <PencilIcon />
              </button>
            ) : (
              <button type="button" onClick={() => setOpen(true)} disabled={loading}
                aria-label={t('wealthGoal.defineLabel')} aria-haspopup="dialog"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink px-3 py-2 text-xs font-semibold text-ink hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 sm:ml-3 sm:w-auto">
                <PlusIcon />{t('wealthGoal.define')}
              </button>
            ))}
          </div>
          {progress && <>
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-xs text-muted">{t('wealthGoal.yourProgress')}</span>
                <span className="text-sm font-semibold text-[#08745c]">{percent} %</span>
              </div>
              <div role="progressbar" aria-label={t('wealthGoal.progress')} aria-valuemin={0} aria-valuemax={100}
                aria-valuenow={progress.visualPercent} aria-valuetext={`${percent} %`}
                className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-benefit" style={{ width: `${progress.visualPercent}%` }} />
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-3 rounded-xl bg-[#f1faf6] px-3 py-2 text-xs sm:inline-grid sm:max-w-full sm:grid-cols-[auto_auto] sm:gap-5">
              <p className="min-w-0 text-muted">{t('wealthGoal.remaining')}
                <span className="mt-0.5 block break-words font-semibold text-ink sm:text-sm">{formatCents(progress.remainingCents)} EUR</span>
              </p>
              <p className="min-w-0 border-l border-ink/10 pl-3 text-muted sm:max-w-sm sm:pl-5">{t('wealthGoal.needed')}
                <span className="mt-0.5 block break-words font-semibold text-ink sm:text-sm">{progress.monthlyCents === null ? t('wealthGoal.due') : t('wealthGoal.perMonth', { amount: formatCents(progress.monthlyCents) })}</span>
              </p>
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
