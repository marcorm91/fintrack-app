import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatInputCents, parseAmount } from '../utils/format';
import { isWealthGoal, type WealthGoal } from '../utils/wealthGoal';

export function WealthGoalDialog({ goal, minimumMonth, readOnly, onSave, onClose }: {
  goal: WealthGoal | null;
  minimumMonth: string;
  readOnly: boolean;
  onSave: (goal: WealthGoal | null) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState(goal ? formatInputCents(goal.targetAmountCents) : '');
  const [month, setMonth] = useState(goal?.targetMonth ?? minimumMonth);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<'amount' | 'month' | 'save' | null>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      opener?.focus();
    };
  }, []);

  const save = async (next: WealthGoal | null) => {
    if (saving || readOnly) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      onClose();
    } catch {
      setError('save');
      setSaving(false);
    }
  };
  const inputClass = 'min-h-11 w-full min-w-0 rounded-xl border border-ink/15 bg-white px-3 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60';
  return (
    <dialog ref={dialog} aria-labelledby={`${id}-title`}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }}
      onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}
      className="wealth-goal-dialog rounded-2xl border border-ink/10 bg-white p-4 text-ink shadow-card sm:p-6">
      <h2 id={`${id}-title`} className="text-lg font-semibold">{t(goal ? 'wealthGoal.edit' : 'wealthGoal.create')}</h2>
      <form className="mt-5" noValidate onSubmit={(event) => {
        event.preventDefault();
        const parsed = parseAmount(amount);
        const targetAmountCents = parsed === null ? NaN : Math.round(parsed * 100);
        if (!Number.isSafeInteger(targetAmountCents) || targetAmountCents <= 0) { setError('amount'); return; }
        const next = { targetAmountCents, targetMonth: month };
        if (!isWealthGoal(next) || month < minimumMonth) { setError('month'); return; }
        void save(next);
      }}>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="min-w-0" htmlFor={`${id}-amount`}>
            <span className="mb-2 block text-sm font-semibold">{t('wealthGoal.amount')}</span>
            <input id={`${id}-amount`} autoFocus inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)}
              disabled={saving || readOnly} aria-invalid={error === 'amount'} aria-describedby={error === 'amount' ? `${id}-error` : undefined} className={inputClass} />
          </label>
          <label className="min-w-0" htmlFor={`${id}-month`}>
            <span className="mb-2 block text-sm font-semibold">{t('wealthGoal.endMonth')}</span>
            <input id={`${id}-month`} type="month" min={minimumMonth} max="9999-12" value={month} onChange={(event) => setMonth(event.target.value)}
              disabled={saving || readOnly} aria-invalid={error === 'month'} aria-describedby={error === 'month' ? `${id}-error` : undefined} className={inputClass} />
          </label>
        </div>
        {error && <p id={`${id}-error`} role="alert" className="mt-3 text-sm text-red-700">{t(`wealthGoal.error.${error}`)}</p>}
        <div className={`mt-5 grid gap-1.5 sm:flex sm:justify-end sm:gap-2 ${goal ? 'grid-cols-[1.4fr_1fr_1fr]' : 'grid-cols-2'}`}>
          {goal && <button type="button" disabled={saving || readOnly} onClick={() => void save(null)}
            className="btn btn-danger min-h-11 px-2 text-[10px] tracking-[0.08em] sm:px-4 sm:text-xs">{t('wealthGoal.delete')}</button>}
          <button type="button" disabled={saving} onClick={onClose}
            className="btn btn-neutral min-h-11 px-2 text-[10px] tracking-[0.08em] sm:px-4 sm:text-xs">{t('actions.cancel')}</button>
          <button type="submit" disabled={saving || readOnly}
            className="btn btn-primary min-h-11 px-2 text-[10px] tracking-[0.08em] sm:px-4 sm:text-xs">{t('wealthGoal.save')}</button>
        </div>
      </form>
    </dialog>
  );
}
