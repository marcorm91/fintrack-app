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
      <div className="relative mt-4 rounded-xl bg-white px-1 py-3" aria-busy={loading}>
        <button type="button" onClick={() => setOpen(true)} disabled={loading || readOnly}
          aria-label={t(goal ? 'wealthGoal.edit' : 'wealthGoal.defineLabel')} aria-describedby={`${id}-details`}
          className="absolute inset-0 z-10 w-full rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default" />
        <div id={`${id}-details`}>
          <div className={`flex gap-3 sm:gap-[22px] ${goal ? 'items-start' : 'flex-wrap items-center'}`}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-benefit/10 text-benefit sm:h-[68px] sm:w-[68px]" aria-hidden="true">
              <TargetIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-ink sm:text-xl">{t('wealthGoal.title')}</p>
              {goal ? (
                <>
                  <p className="mt-1 break-words text-xl font-semibold leading-tight text-ink sm:text-[26px]">{formatCents(goal.targetAmountCents)} EUR</p>
                  <p className="mt-1.5 flex items-center gap-2 text-xs text-muted sm:text-base">
                    <GoalCalendarIcon />
                    <span className="capitalize">{getMonthLabel(goal.targetMonth, i18n.language, 'long')} {goal.targetMonth.slice(0, 4)}</span>
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{t('wealthGoal.empty')}</p>
              )}
            </div>
            {!readOnly && (goal ? (
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 text-ink">
                <PencilIcon />
              </span>
            ) : (
              <span aria-hidden="true" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink px-4 py-2 text-sm font-semibold text-ink sm:ml-4 sm:w-auto">
                <PlusIcon />{t('wealthGoal.define')}
              </span>
            ))}
          </div>
          {progress && <>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs text-muted sm:text-base">{t('wealthGoal.yourProgress')}</span>
                <span className="text-base font-semibold text-[#08745c] sm:text-xl">{percent} %</span>
              </div>
              <div role="progressbar" aria-label={t('wealthGoal.progress')} aria-valuemin={0} aria-valuemax={100}
                aria-valuenow={progress.visualPercent} aria-valuetext={`${percent} %`}
                className="h-3 sm:h-4 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-benefit" style={{ width: `${progress.visualPercent}%` }} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f1faf6] p-3 text-xs sm:inline-grid sm:min-w-[490px] sm:max-w-full sm:grid-cols-[auto_auto] sm:gap-8 sm:px-5 sm:py-4 sm:text-base">
              <p className="min-w-0 text-muted">{t('wealthGoal.remaining')}
                <span className="mt-1 block break-words font-semibold text-ink sm:text-xl">{formatCents(progress.remainingCents)} EUR</span>
              </p>
              <p className="min-w-0 border-l border-ink/10 pl-3 text-muted sm:max-w-sm sm:pl-8">{t('wealthGoal.needed')}
                <span className="mt-1 block break-words font-semibold text-ink sm:text-xl">{progress.monthlyCents === null ? t('wealthGoal.due') : t('wealthGoal.perMonth', { amount: formatCents(progress.monthlyCents) })}</span>
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
