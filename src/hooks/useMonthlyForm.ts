import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { MonthlySnapshotInput, MonthlySummary } from '../db';
import type { FormState } from '../types';
import { formatInputCents, parseAmount } from '../utils/format';

type UseMonthlyFormOptions = {
  summary: MonthlySummary | null;
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
  portfolio: ''
};

export function useMonthlyForm({
  summary,
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
    if (!summary) {
      resetForm();
      return;
    }
    if (summary.month !== monthValue) {
      return;
    }
    setForm({
      income: summary.incomeCents ? formatInputCents(summary.incomeCents) : '',
      expense: summary.expenseCents ? formatInputCents(summary.expenseCents) : '',
      balance: summary.balanceCents ? formatInputCents(summary.balanceCents) : '',
      portfolio: summary.portfolioCents ? formatInputCents(summary.portfolioCents) : ''
    });
  }, [summary, monthValue, resetForm]);

  const handleChange = useCallback(
    (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
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

      setSaving(true);
      try {
        await saveSnapshot({
          month: monthValue,
          incomeCents: Math.round(incomeValue * 100),
          expenseCents: Math.round(expenseValue * 100),
          balanceCents: Math.round(balanceValue * 100),
          portfolioCents: hasInvestmentPortfolio
            ? Math.round((portfolioValue ?? 0) * 100)
            : summary?.portfolioCents ?? 0
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
    [form, hasInvestmentPortfolio, monthValue, refreshData, readOnly, saveSnapshot, setError, summary, t]
  );

  return {
    form,
    saving,
    handleChange,
    handleSubmit,
    resetForm
  };
}
