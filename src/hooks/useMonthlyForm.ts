import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { MonthlySnapshotInput, MonthlySummary } from '../db';
import type { FormState } from '../types';
import { formatInputCents, parseAmount } from '../utils/format';

type UseMonthlyFormOptions = {
  summary: MonthlySummary | null;
  fallbackWealthSummary?: MonthlySummary | null;
  monthValue: string;
  saveSnapshot: (snapshot: MonthlySnapshotInput) => Promise<void>;
  refreshData: () => Promise<void> | void;
  setError: (message: string | null) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  readOnly?: boolean;
  hasInvestmentPortfolio?: boolean;
};

const emptyForm: FormState = {
  income: '',
  expense: '',
  balance: '',
  portfolio: '',
  portfolioContribution: '',
  note: ''
};

export function useMonthlyForm({
  summary,
  fallbackWealthSummary = null,
  monthValue,
  saveSnapshot,
  refreshData,
  setError,
  t,
  readOnly = false,
  hasInvestmentPortfolio = true
}: UseMonthlyFormOptions) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
  }, []);

  useEffect(() => {
    const monthSummary = summary?.month === monthValue ? summary : null;
    if (monthSummary) {
      setForm({
        income: monthSummary.incomeCents ? formatInputCents(monthSummary.incomeCents) : '',
        expense: monthSummary.expenseCents ? formatInputCents(monthSummary.expenseCents) : '',
        balance: monthSummary.balanceCents ? formatInputCents(monthSummary.balanceCents) : '',
        portfolio: monthSummary.portfolioCents ? formatInputCents(monthSummary.portfolioCents) : '',
        portfolioContribution:
          monthSummary.portfolioContributionCents === null
            ? ''
            : formatInputCents(monthSummary.portfolioContributionCents),
        note: monthSummary.note
      });
      return;
    }

    if (fallbackWealthSummary) {
      setForm({
        income: '',
        expense: '',
        balance: fallbackWealthSummary.balanceCents ? formatInputCents(fallbackWealthSummary.balanceCents) : '',
        portfolio: fallbackWealthSummary.portfolioCents ? formatInputCents(fallbackWealthSummary.portfolioCents) : '',
        portfolioContribution: '',
        note: ''
      });
      return;
    }

    resetForm();
  }, [fallbackWealthSummary, summary, monthValue, resetForm]);

  const handleChange = useCallback(
    (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (readOnly) {
        return;
      }
      setError(null);

      const incomeValue = parseAmount(form.income);
      if (incomeValue === null || incomeValue < 0) {
        setError(t('errors.invalidIncome'));
        return;
      }

      const expenseValue = parseAmount(form.expense);
      if (expenseValue === null || expenseValue < 0) {
        setError(t('errors.invalidExpense'));
        return;
      }

      const balanceValue = parseAmount(form.balance);
      if (balanceValue === null) {
        setError(t('errors.invalidBalance'));
        return;
      }

      const portfolioValue = hasInvestmentPortfolio ? parseAmount(form.portfolio) : null;
      if (hasInvestmentPortfolio && (portfolioValue === null || portfolioValue < 0)) {
        setError(t('errors.invalidPortfolio'));
        return;
      }

      const portfolioContributionInput = form.portfolioContribution.trim();
      const portfolioContributionValue =
        hasInvestmentPortfolio && portfolioContributionInput !== ''
          ? parseAmount(form.portfolioContribution)
          : null;
      if (
        hasInvestmentPortfolio &&
        portfolioContributionInput !== '' &&
        (portfolioContributionValue === null || portfolioContributionValue < 0)
      ) {
        setError(t('investment.invalidContribution'));
        return;
      }

      setSaving(true);
      try {
        await saveSnapshot({
          month: monthValue,
          incomeCents: Math.round(incomeValue * 100),
          expenseCents: Math.round(expenseValue * 100),
          balanceCents: Math.round(balanceValue * 100),
          portfolioCents: hasInvestmentPortfolio
            ? Math.round((portfolioValue ?? 0) * 100)
            : summary?.portfolioCents ?? fallbackWealthSummary?.portfolioCents ?? 0,
          portfolioContributionCents: hasInvestmentPortfolio
            ? portfolioContributionValue === null
              ? null
              : Math.round(portfolioContributionValue * 100)
            : summary?.portfolioContributionCents ?? null,
          note: form.note.replace(/\s+/g, ' ').trim().slice(0, 500)
        });
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : JSON.stringify(err);
        setError(message || t('errors.saveSummary'));
      } finally {
        setSaving(false);
      }
    },
    [fallbackWealthSummary, form, hasInvestmentPortfolio, monthValue, refreshData, readOnly, saveSnapshot, setError, summary, t]
  );

  return {
    form,
    saving,
    handleChange,
    handleSubmit,
    resetForm
  };
}
