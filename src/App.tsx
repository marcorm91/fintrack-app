import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useCharts } from './hooks/useCharts';
import { useDatabasePath } from './hooks/useDatabasePath';
import { useImportFlow } from './hooks/useImportFlow';
import { useMonthlyData } from './hooks/useMonthlyData';
import { useSeriesDerived } from './hooks/useSeriesDerived';
import type {
  AllTableSortKey,
  ChartType,
  FormState,
  SeriesKey,
  SortDirection,
  TabKey,
  ToastTone,
  YearTableSortKey
} from './types';
import { TABS } from './constants';
import { getMonthValue, getYearValue } from './utils/date';
import { formatInputCents, parseAmount } from './utils/format';
import { parseCsvSnapshots, parseMonthCsv } from './utils/csv';
import { summaryFromSeries } from './utils/series';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { ConfirmDialog, DatabaseSettingsDialog, InfoDialog, TextImportDialog } from './components/Dialogs';
import { DotsVerticalIcon, InfoIcon } from './components/icons';
import { Toast } from './components/Toast';
import { HistoryView } from './features/history/HistoryView';
import { MonthView } from './features/month/MonthView';
import { YearView } from './features/year/YearView';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('month');
  const [monthChartType, setMonthChartType] = useState<ChartType>('bar');
  const [yearChartType, setYearChartType] = useState<ChartType>('bar');
  const [allYearsChartType, setAllYearsChartType] = useState<ChartType>('bar');
  const [monthValue, setMonthValue] = useState(() => getMonthValue(new Date()));
  const [yearValue, setYearValue] = useState(() => getYearValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [monthSeriesVisibility, setMonthSeriesVisibility] = useState<Record<SeriesKey, boolean>>({
    income: true,
    expense: true,
    balance: true,
    benefit: true
  });
  const [yearSeriesVisibility, setYearSeriesVisibility] = useState<Record<SeriesKey, boolean>>({
    income: true,
    expense: true,
    balance: true,
    benefit: true
  });
  const [allYearsSeriesVisibility, setAllYearsSeriesVisibility] = useState<Record<SeriesKey, boolean>>({
    income: true,
    expense: true,
    balance: true,
    benefit: true
  });
  const [yearTableSort, setYearTableSort] = useState<{ key: YearTableSortKey; direction: SortDirection }>({
    key: 'month',
    direction: 'asc'
  });
  const [allYearsTableSort, setAllYearsTableSort] = useState<{ key: AllTableSortKey; direction: SortDirection }>({
    key: 'year',
    direction: 'desc'
  });
  const [form, setForm] = useState<FormState>({
    income: '',
    expense: '',
    balance: ''
  });
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const activeLanguage = language.startsWith('en') ? 'en' : 'es';
  const {
    summary,
    series,
    error,
    refresh,
    saveSnapshot,
    deleteMonth,
    deleteYear,
    deleteAll,
    setError
  } = useMonthlyData({ loadErrorMessage: t('errors.loadData') });

  const refreshData = useCallback(() => refresh(monthValue), [refresh, monthValue]);
  const {
    importInputRef,
    importMenuOpen,
    toggleImportMenu,
    closeImportMenu,
    textImportScope,
    textImportValue,
    setTextImportValue,
    setInfoScope,
    confirmDialog,
    textImportDetails,
    infoDialog,
    importing,
    deletingMonth,
    deletingYear,
    deletingAll,
    openFileImport,
    openTextImport,
    closeTextImport,
    onFileChange,
    confirmTextImport,
    onConfirm,
    closeConfirm,
    openDeleteMonth,
    openDeleteYear,
    openDeleteAll
  } = useImportFlow({
    monthValue,
    yearValue,
    language,
    t,
    parseMonthCsv,
    parseCsvSnapshots,
    saveSnapshot,
    deleteMonth,
    deleteYear,
    deleteAll,
    refreshData,
    setError,
    onToast: setToast,
    onMonthDeleted: () => setForm({ income: '', expense: '', balance: '' })
  });
  const {
    yearSeries,
    allYears,
    yearTotals,
    availableYears,
    yearTrendByMonth,
    allYearsTrendByYear,
    sortedYearSeries,
    sortedAllYears,
    hasChartData,
    hasAllYearsData
  } = useSeriesDerived({
    series,
    yearValue,
    monthValue,
    yearTableSort,
    allYearsTableSort
  });

  const monthPoint = series.find((point) => point.month === monthValue);
  const displaySummary =
    summary ??
    (monthPoint
      ? summaryFromSeries(monthPoint)
      : summaryFromSeries({
          month: monthValue,
          incomeCents: 0,
          expenseCents: 0,
          balanceCents: 0,
          benefitCents: 0
        }));

  const hasMonthData =
    displaySummary.incomeCents !== 0 ||
    displaySummary.expenseCents !== 0 ||
    displaySummary.balanceCents !== 0 ||
    displaySummary.benefitCents !== 0;

  const {
    monthChartData,
    monthChartOptions,
    benefitChartData,
    benefitChartOptions,
    yearChartData,
    yearChartOptions,
    allYearsChartData,
    allYearsChartOptions,
    isMonthLine,
    isYearLine,
    isAllYearsLine,
    hasVisibleMonthBars,
    showMonthBenefit
  } = useCharts({
    language,
    t,
    displaySummary,
    monthSeriesVisibility,
    monthChartType,
    yearSeriesVisibility,
    yearChartType,
    allYearsSeriesVisibility,
    allYearsChartType,
    yearSeries,
    allYears
  });
  const {
    currentPath,
    defaultPath,
    inputPath,
    setInputPath,
    isDefaultPath,
    loading: isDatabasePathLoading,
    error: databasePathError,
    setError: setDatabasePathError,
    savePath,
    browsePath,
    resetPath
  } = useDatabasePath({
    onPathChange: () => {
      refreshData();
    }
  });

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeoutId = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    closeImportMenu();
  }, [activeTab, closeImportMenu]);

  useEffect(() => {
    if (!summary) {
      setForm({ income: '', expense: '', balance: '' });
      return;
    }
    if (summary.month !== monthValue) {
      return;
    }
    setForm({
      income: summary.incomeCents ? formatInputCents(summary.incomeCents) : '',
      expense: summary.expenseCents ? formatInputCents(summary.expenseCents) : '',
      balance: summary.balanceCents ? formatInputCents(summary.balanceCents) : ''
    });
  }, [summary, monthValue]);

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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

    setSaving(true);
    try {
      await saveSnapshot({
        month: monthValue,
        incomeCents: Math.round(incomeValue * 100),
        expenseCents: Math.round(expenseValue * 100),
        balanceCents: Math.round(balanceValue * 100)
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
  };

  const toggleMonthSeries = (key: SeriesKey) => {
    setMonthSeriesVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleYearSeries = (key: SeriesKey) => {
    setYearSeriesVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAllYearsSeries = (key: SeriesKey) => {
    setAllYearsSeriesVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleYearSort = (key: YearTableSortKey) => {
    setYearTableSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const handleAllYearsSort = (key: AllTableSortKey) => {
    setAllYearsTableSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const monthBenefitDotClass = displaySummary.benefitCents < 0 ? 'bg-benefitNegative' : 'bg-benefit';
  const yearBenefitDotClass = yearTotals.benefitCents < 0 ? 'bg-benefitNegative' : 'bg-benefit';

  const currentMonthValue = getMonthValue(new Date());
  const isCurrentMonth = monthValue === currentMonthValue;
  const currentYearValue = getYearValue(new Date());
  const isCurrentYear = yearValue === currentYearValue;
  const handleOpenSettings = () => {
    setDatabasePathError(null);
    setSettingsOpen(true);
  };
  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };
  const handleSaveDatabasePath = () => {
    const saved = savePath();
    if (saved) {
      setSettingsOpen(false);
    }
  };
  const handleResetDatabasePath = () => {
    resetPath();
    setSettingsOpen(false);
  };
  const handleDatabasePathInputChange = (value: string) => {
    setDatabasePathError(null);
    setInputPath(value);
  };
  const infoDialogContent = infoDialog ? (
    <div className="space-y-2">
      {infoDialog.lines.map((line, index) => (
        <p key={`${infoDialog.title}-line-${index}`}>{line}</p>
      ))}
      {infoDialog.examples.map((example, index) => (
        <div
          key={`${infoDialog.title}-example-${index}`}
          className="rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink"
        >
          {example}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(247,231,211,0.9),rgba(247,231,211,0)_60%),radial-gradient(circle_at_top_right,rgba(215,238,244,0.9),rgba(215,238,244,0)_55%),linear-gradient(120deg,#f5f2ec_0%,#eef4f6_100%)] relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-6 h-20 w-28 -rotate-6 text-accent/25"
      >
        <svg viewBox="0 0 140 90" className="h-full w-full" role="img">
          <rect
            x="6"
            y="10"
            width="128"
            height="70"
            rx="12"
            className="fill-current"
            opacity="0.18"
          />
          <rect
            x="16"
            y="20"
            width="108"
            height="50"
            rx="10"
            className="fill-none stroke-current"
            strokeWidth="3"
            opacity="0.5"
          />
          <circle
            cx="70"
            cy="45"
            r="16"
            className="fill-none stroke-current"
            strokeWidth="3"
            opacity="0.65"
          />
          <path
            d="M30 45h16M94 45h16"
            className="fill-none stroke-current"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      </div>
      <div className="w-full px-6 py-10 relative z-10 min-h-screen flex flex-col">
        <AppHeader
          activeLanguage={activeLanguage}
          onLanguageChange={(languageValue) => {
            void i18n.changeLanguage(languageValue);
          }}
          onOpenSettings={handleOpenSettings}
          t={t}
        />
        <input
          ref={importInputRef}
          type="file"
          accept=".csv"
          onChange={onFileChange}
          className="hidden"
        />

        <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition md:w-auto ${
                    isActive
                      ? 'bg-accent text-white shadow-md'
                      : 'border border-ink/10 bg-white/70 text-muted hover:shadow-sm'
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
          {activeTab === 'month' ? (
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleImportMenu('month')}
                    disabled={importing || deletingMonth}
                    aria-label={t('actions.importOptions')}
                    title={t('actions.importOptions')}
                    className="rounded-full border border-accent/30 bg-white/80 p-2 text-accent shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <DotsVerticalIcon />
                  </button>
                  {importMenuOpen === 'month' ? (
                    <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-ink/10 bg-white p-2 shadow-card">
                      <button
                        type="button"
                        onClick={() => openFileImport('month')}
                        className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
                      >
                        {t('actions.importCsv')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openTextImport('month')}
                        className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
                      >
                        {t('actions.pasteData')}
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setInfoScope('month')}
                  className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
                >
                  <InfoIcon />
                  <span>{t('actions.info')}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => openDeleteMonth(monthValue)}
                disabled={importing || deletingMonth}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingMonth ? t('actions.deleting') : t('actions.deleteMonth')}
              </button>
            </div>
          ) : null}
          {activeTab === 'year' ? (
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleImportMenu('year')}
                    disabled={importing || deletingYear}
                    aria-label={t('actions.importOptions')}
                    title={t('actions.importOptions')}
                    className="rounded-full border border-accent/30 bg-white/80 p-2 text-accent shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <DotsVerticalIcon />
                  </button>
                  {importMenuOpen === 'year' ? (
                    <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-ink/10 bg-white p-2 shadow-card">
                      <button
                        type="button"
                        onClick={() => openFileImport('year')}
                        className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
                      >
                        {t('actions.importCsv')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openTextImport('year')}
                        className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
                      >
                        {t('actions.pasteData')}
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setInfoScope('year')}
                  className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
                >
                  <InfoIcon />
                  <span>{t('actions.info')}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => openDeleteYear(yearValue)}
                disabled={importing || deletingYear}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingYear ? t('actions.deleting') : t('actions.deleteYear')}
              </button>
            </div>
          ) : null}
          {activeTab === 'all' ? (
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleImportMenu('all')}
                    disabled={importing || deletingAll}
                    aria-label={t('actions.importOptions')}
                    title={t('actions.importOptions')}
                    className="rounded-full border border-accent/30 bg-white/80 p-2 text-accent shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <DotsVerticalIcon />
                  </button>
                  {importMenuOpen === 'all' ? (
                    <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-ink/10 bg-white p-2 shadow-card">
                      <button
                        type="button"
                        onClick={() => openFileImport('all')}
                        className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
                      >
                        {t('actions.importCsv')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openTextImport('all')}
                        className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
                      >
                        {t('actions.pasteData')}
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setInfoScope('all')}
                  className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
                >
                  <InfoIcon />
                  <span>{t('actions.info')}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => openDeleteAll()}
                disabled={importing || deletingAll}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingAll ? t('actions.deleting') : t('actions.deleteAll')}
              </button>
            </div>
          ) : null}
        </div>

        <main className="mt-6 grid gap-6 flex-1">
          {activeTab === 'month' ? (
            <MonthView
              monthValue={monthValue}
              setMonthValue={setMonthValue}
              currentMonthValue={currentMonthValue}
              isCurrentMonth={isCurrentMonth}
              displaySummary={displaySummary}
              monthSeriesVisibility={monthSeriesVisibility}
              toggleMonthSeries={toggleMonthSeries}
              monthBenefitDotClass={monthBenefitDotClass}
              monthChartType={monthChartType}
              setMonthChartType={setMonthChartType}
              monthChartData={monthChartData}
              monthChartOptions={monthChartOptions}
              benefitChartData={benefitChartData}
              benefitChartOptions={benefitChartOptions}
              hasMonthData={hasMonthData}
              hasVisibleMonthBars={hasVisibleMonthBars}
              showMonthBenefit={showMonthBenefit}
              isMonthLine={isMonthLine}
              form={form}
              onFormChange={handleChange}
              onSubmit={handleSubmit}
              saving={saving}
              error={error}
            />
          ) : null}
          {activeTab === 'year' ? (
            <YearView
              yearValue={yearValue}
              setYearValue={setYearValue}
              currentYearValue={currentYearValue}
              isCurrentYear={isCurrentYear}
              availableYears={availableYears}
              yearTotals={yearTotals}
              yearBenefitDotClass={yearBenefitDotClass}
              yearSeriesVisibility={yearSeriesVisibility}
              toggleYearSeries={toggleYearSeries}
              yearChartType={yearChartType}
              setYearChartType={setYearChartType}
              hasChartData={hasChartData}
              yearChartData={yearChartData}
              yearChartOptions={yearChartOptions}
              sortedYearSeries={sortedYearSeries}
              yearTableSort={yearTableSort}
              handleYearSort={handleYearSort}
              yearTrendByMonth={yearTrendByMonth}
              isYearLine={isYearLine}
            />
          ) : null}
          {activeTab === 'all' ? (
            <HistoryView
              allYearsSeriesVisibility={allYearsSeriesVisibility}
              toggleAllYearsSeries={toggleAllYearsSeries}
              hasAllYearsData={hasAllYearsData}
              allYearsChartData={allYearsChartData}
              allYearsChartOptions={allYearsChartOptions}
              allYearsChartType={allYearsChartType}
              setAllYearsChartType={setAllYearsChartType}
              sortedAllYears={sortedAllYears}
              allYearsTableSort={allYearsTableSort}
              handleAllYearsSort={handleAllYearsSort}
              allYearsTrendByYear={allYearsTrendByYear}
              isAllYearsLine={isAllYearsLine}
            />
          ) : null}
        </main>
        <AppFooter />
        <ConfirmDialog
          open={Boolean(confirmDialog)}
          title={confirmDialog?.title ?? ''}
          message={confirmDialog?.message ?? ''}
          confirmLabel={confirmDialog?.confirmLabel ?? t('actions.confirm')}
          onConfirm={onConfirm}
          onCancel={closeConfirm}
        />
        <TextImportDialog
          open={Boolean(textImportScope)}
          title={textImportDetails?.title ?? ''}
          description={textImportDetails?.description ?? ''}
          placeholder={textImportDetails?.placeholder ?? ''}
          value={textImportValue}
          onChange={setTextImportValue}
          onConfirm={confirmTextImport}
          onCancel={closeTextImport}
        />
        <InfoDialog
          open={Boolean(infoDialog)}
          title={infoDialog?.title ?? ''}
          content={infoDialogContent}
          onClose={() => setInfoScope(null)}
        />
        <DatabaseSettingsDialog
          open={settingsOpen}
          currentPath={currentPath}
          defaultPath={defaultPath}
          inputPath={inputPath}
          isDefaultPath={isDefaultPath}
          loading={isDatabasePathLoading}
          error={databasePathError}
          onInputChange={handleDatabasePathInputChange}
          onBrowse={browsePath}
          onSave={handleSaveDatabasePath}
          onReset={handleResetDatabasePath}
          onClose={handleCloseSettings}
        />
        {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      </div>
    </div>
  );
}
