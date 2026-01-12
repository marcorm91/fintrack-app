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
import { useDatabaseSettings } from './hooks/useDatabaseSettings';
import { useInfoDialogContent } from './hooks/useInfoDialogContent';
import { useImportFlow } from './hooks/useImportFlow';
import { useMonthlyData } from './hooks/useMonthlyData';
import { useMonthlyForm } from './hooks/useMonthlyForm';
import { usePeriodSelection } from './hooks/usePeriodSelection';
import { useSeriesDerived } from './hooks/useSeriesDerived';
import { useSeriesVisibility } from './hooks/useSeriesVisibility';
import { useToastAutoDismiss } from './hooks/useToastAutoDismiss';
import type {
  AllTableSortKey,
  ChartType,
  SortDirection,
  TabKey,
  YearTableSortKey
} from './types';
import { parseCsvSnapshots, parseMonthCsv } from './utils/csv';
import { summaryFromSeries } from './utils/series';
import { AppLayout } from './components/AppLayout';
import { TabsBar } from './components/TabsBar';
import { ConfirmDialog, DatabaseSettingsDialog, InfoDialog, TextImportDialog } from './components/Dialogs';
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
  const {
    monthValue,
    setMonthValue,
    yearValue,
    setYearValue,
    currentMonthValue,
    currentYearValue,
    isCurrentMonth,
    isCurrentYear
  } = usePeriodSelection();
  const { toast, setToast } = useToastAutoDismiss();
  const {
    visibility: monthSeriesVisibility,
    toggleSeries: toggleMonthSeries,
    showOnlySeries: showOnlyMonthSeries
  } = useSeriesVisibility();
  const {
    visibility: yearSeriesVisibility,
    toggleSeries: toggleYearSeries,
    showOnlySeries: showOnlyYearSeries
  } = useSeriesVisibility();
  const {
    visibility: allYearsSeriesVisibility,
    toggleSeries: toggleAllYearsSeries,
    showOnlySeries: showOnlyAllYearsSeries
  } = useSeriesVisibility();
  const [yearTableSort, setYearTableSort] = useState<{ key: YearTableSortKey; direction: SortDirection }>({
    key: 'month',
    direction: 'asc'
  });
  const [allYearsTableSort, setAllYearsTableSort] = useState<{ key: AllTableSortKey; direction: SortDirection }>({
    key: 'year',
    direction: 'desc'
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
  const { form, saving, handleChange, handleSubmit, resetForm } = useMonthlyForm({
    summary,
    monthValue,
    saveSnapshot,
    refreshData,
    setError,
    t
  });
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
    onMonthDeleted: resetForm
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
    settingsOpen,
    openSettings,
    closeSettings,
    saveSettings,
    resetSettings,
    handleDatabasePathInputChange,
    currentPath,
    defaultPath,
    inputPath,
    isDefaultPath,
    loading: isDatabasePathLoading,
    error: databasePathError,
    browsePath
  } = useDatabaseSettings({ onPathChange: refreshData });
  const infoDialogContent = useInfoDialogContent(infoDialog);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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

  return (
    <AppLayout
      activeLanguage={activeLanguage}
      onLanguageChange={(languageValue) => {
        void i18n.changeLanguage(languageValue);
      }}
      onOpenSettings={openSettings}
      t={t}
      importInputRef={importInputRef}
      onFileChange={onFileChange}
      tabs={
        <TabsBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          monthValue={monthValue}
          yearValue={yearValue}
          importMenuOpen={importMenuOpen}
          toggleImportMenu={toggleImportMenu}
          openFileImport={openFileImport}
          openTextImport={openTextImport}
          setInfoScope={setInfoScope}
          closeImportMenu={closeImportMenu}
          openDeleteMonth={openDeleteMonth}
          openDeleteYear={openDeleteYear}
          openDeleteAll={openDeleteAll}
          importing={importing}
          deletingMonth={deletingMonth}
          deletingYear={deletingYear}
          deletingAll={deletingAll}
          t={t}
        />
      }
      dialogs={
        <>
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
            onSave={saveSettings}
            onReset={resetSettings}
            onClose={closeSettings}
          />
        </>
      }
      toast={toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    >
      {activeTab === 'month' ? (
        <MonthView
          monthValue={monthValue}
          setMonthValue={setMonthValue}
          currentMonthValue={currentMonthValue}
          isCurrentMonth={isCurrentMonth}
          displaySummary={displaySummary}
          monthSeriesVisibility={monthSeriesVisibility}
          toggleMonthSeries={toggleMonthSeries}
          showOnlyMonthSeries={showOnlyMonthSeries}
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
          showOnlyYearSeries={showOnlyYearSeries}
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
          showOnlyAllYearsSeries={showOnlyAllYearsSeries}
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
    </AppLayout>
  );
}
