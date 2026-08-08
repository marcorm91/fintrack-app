import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharts } from './hooks/useCharts';
import { useDatabaseSettings } from './hooks/useDatabaseSettings';
import { useExportData } from './hooks/useExportData';
import { useInfoDialogContent } from './hooks/useInfoDialogContent';
import { useImportFlow } from './hooks/useImportFlow';
import { useMonthlyData } from './hooks/useMonthlyData';
import { useMonthlyForm } from './hooks/useMonthlyForm';
import { useMonthlyInsights } from './hooks/useMonthlyInsights';
import { usePeriodSelection } from './hooks/usePeriodSelection';
import { useYearInsights } from './hooks/useYearInsights';
import { useInvestmentPortfolioSetting } from './hooks/useInvestmentPortfolioSetting';
import { useSeriesDerived } from './hooks/useSeriesDerived';
import { useSeriesVisibility } from './hooks/useSeriesVisibility';
import { useSafeAreaInsets } from './hooks/useSafeAreaInsets';
import { useReadOnlySetting } from './hooks/useReadOnlySetting';
import { useToastAutoDismiss } from './hooks/useToastAutoDismiss';
import { useUpdateStatus } from './hooks/useUpdateStatus';
import { useIsMobile } from './hooks/useIsMobile';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';
import { useTableSort } from './hooks/useTableSort';
import { useAuthSession } from './hooks/useAuthSession';
import { useAppMode, type AppMode } from './hooks/useAppMode';
import type { AllTableSortKey, TabKey, YearTableSortKey } from './types';
import { parseCsvSnapshots, parseMonthCsv } from './utils/csv';
import { shiftMonthValue } from './utils/date';
import { applyInvestmentPortfolioSetting, getLatestClosingBalancePointAtOrBefore, summaryFromSeries } from './utils/series';
import { AppLayout } from './components/AppLayout';
import { GlobalWealthSummary } from './components/GlobalWealthSummary';
import { InsightsPanel } from './components/InsightsPanel';
import { TabsBar } from './components/TabsBar';
import { ConfirmDialog, DatabaseSettingsDialog, InfoDialog, TextImportDialog } from './components/Dialogs';
import { Toast } from './components/Toast';
import { AuthScreen } from './components/AuthScreen';
import { AccessModeScreen } from './components/AccessModeScreen';
import { dismissSplash } from './utils/splash';
const HistoryView = lazy(() =>
  import('./features/history/HistoryView').then((module) => ({ default: module.HistoryView }))
);
const MonthView = lazy(() =>
  import('./features/month/MonthView').then((module) => ({ default: module.MonthView }))
);
const YearView = lazy(() =>
  import('./features/year/YearView').then((module) => ({ default: module.YearView }))
);

export default function App() {
  useSafeAreaInsets();
  const { mode, setMode } = useAppMode();
  const {
    user,
    loading,
    initializationError,
    signIn,
    requestPasswordReset,
    signOut
  } = useAuthSession(mode === 'cloud');

  const handleAppModeChange = useCallback(
    async (nextMode: AppMode) => {
      setMode(nextMode);
      if (nextMode === 'local' && user) {
        try {
          await signOut();
        } catch {
          // Local mode must remain available even if Firebase cannot respond.
        }
      }
    },
    [setMode, signOut, user]
  );

  useEffect(() => {
    const accessScreenVisible = mode === null || (mode === 'cloud' && !loading && !user);
    if (!accessScreenVisible) {
      return;
    }
    return dismissSplash();
  }, [loading, mode, user]);

  if (mode === null) {
    return (
      <AccessModeScreen
        onChooseCloud={() => setMode('cloud')}
        onChooseLocal={() => setMode('local')}
      />
    );
  }
  if (mode === 'cloud' && loading) {
    return null;
  }
  if (mode === 'cloud' && !user) {
    return (
      <AuthScreen
        initializationError={initializationError}
        onSignIn={signIn}
        onRequestPasswordReset={requestPasswordReset}
        onUseLocal={() => {
          void handleAppModeChange('local');
        }}
      />
    );
  }

  return (
    <FintrackApp
      appMode={mode}
      userEmail={mode === 'cloud' ? (user?.email ?? null) : null}
      onSignOut={signOut}
      onChangeAppMode={handleAppModeChange}
    />
  );
}

function FintrackApp({
  appMode,
  userEmail,
  onSignOut,
  onChangeAppMode
}: {
  appMode: AppMode;
  userEmail: string | null;
  onSignOut: () => Promise<void>;
  onChangeAppMode: (mode: AppMode) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('month');
  const [appReady, setAppReady] = useState(false);
  const [monthSwipeBlocked, setMonthSwipeBlocked] = useState(false);
  const isMobile = useIsMobile();
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
  const { readOnly, toggleReadOnly } = useReadOnlySetting();
  const { toast, setToast } = useToastAutoDismiss();
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
  const { sort: yearTableSort, toggleSort: handleYearSort } = useTableSort<YearTableSortKey>({
    key: 'month',
    direction: 'asc'
  });
  const { sort: allYearsTableSort, toggleSort: handleAllYearsSort } = useTableSort<AllTableSortKey>({
    key: 'year',
    direction: 'desc'
  });
  const [yearComparisonValue, setYearComparisonValue] = useState('');
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
  } = useMonthlyData({ loadErrorMessage: t('errors.loadData'), readOnly });
  const portfolioSettingError = useCallback((message: string) => {
    setError(message || t('errors.saveSummary'));
  }, [setError, t]);
  const {
    enabled: hasInvestmentPortfolio,
    setEnabled: setHasInvestmentPortfolio
  } = useInvestmentPortfolioSetting({ onError: portfolioSettingError });
  const effectiveSeries = useMemo(
    () => series.map((point) => applyInvestmentPortfolioSetting(point, hasInvestmentPortfolio)),
    [hasInvestmentPortfolio, series]
  );
  const effectiveSummary = useMemo(
    () => (summary ? applyInvestmentPortfolioSetting(summary, hasInvestmentPortfolio) : null),
    [hasInvestmentPortfolio, summary]
  );
  const monthInsightsVisibility = useMemo(
    () => ({
      income: true,
      expense: true,
      benefit: true,
      balance: true,
      portfolio: hasInvestmentPortfolio,
      totalWealth: hasInvestmentPortfolio
    }),
    [hasInvestmentPortfolio]
  );
  const effectiveYearSeriesVisibility = useMemo(
    () =>
      hasInvestmentPortfolio
        ? yearSeriesVisibility
        : { ...yearSeriesVisibility, portfolio: false, totalWealth: false },
    [hasInvestmentPortfolio, yearSeriesVisibility]
  );
  const effectiveAllYearsSeriesVisibility = useMemo(
    () =>
      hasInvestmentPortfolio
        ? allYearsSeriesVisibility
        : { ...allYearsSeriesVisibility, portfolio: false, totalWealth: false },
    [allYearsSeriesVisibility, hasInvestmentPortfolio]
  );

  const refreshData = useCallback(() => refresh(monthValue), [refresh, monthValue]);
  const handleMonthSwipe = useCallback(
    (direction: 'next' | 'previous') => {
      setMonthValue((prev) => shiftMonthValue(prev, direction === 'next' ? 1 : -1));
    },
    [setMonthValue]
  );
  const { motionClassName: monthMotionClassName, swipeHandlers: monthSwipeHandlers } =
    useSwipeNavigation({
      enabled: isMobile,
      blocked: monthSwipeBlocked,
      onSwipe: handleMonthSwipe
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
  const fallbackWealthSummary = useMemo(() => {
    if (effectiveSummary?.month === monthValue) {
      return null;
    }
    const latestPoint = getLatestClosingBalancePointAtOrBefore(effectiveSeries, monthValue);
    return latestPoint ? summaryFromSeries(latestPoint) : null;
  }, [effectiveSeries, effectiveSummary?.month, monthValue]);
  const { form, saving, handleChange, handleSubmit, resetForm } = useMonthlyForm({
    summary,
    fallbackWealthSummary,
    monthValue,
    saveSnapshot,
    refreshData,
    setError,
    t,
    readOnly,
    hasInvestmentPortfolio
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
    series: effectiveSeries,
    yearValue,
    monthValue,
    yearTableSort,
    allYearsTableSort
  });

  const monthPoint = effectiveSeries.find((point) => point.month === monthValue);
  const displaySummary =
    effectiveSummary ??
    (monthPoint
      ? summaryFromSeries(monthPoint)
      : summaryFromSeries({
          month: monthValue,
          incomeCents: 0,
          expenseCents: 0,
          balanceCents: 0,
          portfolioCents: 0,
          totalWealthCents: 0,
          benefitCents: 0,
          note: ''
        }));

  const hasMonthData = Boolean(summary || series.find((point) => point.month === monthValue));

  const monthInsights = useMonthlyInsights({
    monthValue,
    displaySummary,
    series: effectiveSeries,
    monthSeriesVisibility: monthInsightsVisibility,
    hasMonthData,
    isCurrentMonth,
    t
  });
  const yearInsights = useYearInsights({
    yearValue,
    yearTotals,
    allYears,
    yearSeriesVisibility: effectiveYearSeriesVisibility,
    compareYearValue: yearComparisonValue,
    t
  });
  const yearComparisonYears = useMemo(
    () => allYears.map((point) => point.year).filter((year) => year !== yearValue),
    [allYears, yearValue]
  );

  const {
    yearChartData,
    yearWealthChartData,
    yearChartOptions,
    allYearsChartData,
    allYearsWealthChartData,
    allYearsChartOptions
  } = useCharts({
    language,
    t,
    yearSeriesVisibility: effectiveYearSeriesVisibility,
    allYearsSeriesVisibility: effectiveAllYearsSeriesVisibility,
    yearSeries,
    allYears
  });
  const {
    status: updateStatus,
    currentVersion,
    latestVersion,
    latestReleaseUrl,
    isOnline,
    checkForUpdates
  } = useUpdateStatus();
  const {
    exportCsv,
    exportSql,
    exportJson,
    openJsonImport,
    onJsonBackupFileChange,
    backupInputRef,
    backupDatabase,
    exportingCsv,
    exportingSql,
    exportingJson,
    importingJson,
    backingUp,
    exportStatus,
    backupStatus
  } = useExportData({
    currentPath,
    language,
    currentVersion,
    hasInvestmentPortfolio,
    readOnly,
    saveSnapshot,
    setInvestmentPortfolioEnabled: setHasInvestmentPortfolio,
    refreshData,
    t
  });
  const infoDialogContent = useInfoDialogContent(infoDialog);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await refreshData();
      } finally {
        if (active) {
          setAppReady(true);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [refreshData]);

  useEffect(() => {
    if (!appReady) {
      return;
    }
    return dismissSplash();
  }, [appReady]);

  const globalWealthSummary = useMemo(() => {
    const latestPoint = getLatestClosingBalancePointAtOrBefore(effectiveSeries, currentMonthValue);
    return latestPoint
      ? summaryFromSeries(latestPoint)
      : summaryFromSeries({
          month: currentMonthValue,
          incomeCents: 0,
          expenseCents: 0,
          balanceCents: 0,
          portfolioCents: 0,
          totalWealthCents: 0,
          benefitCents: 0,
          note: ''
        });
  }, [currentMonthValue, effectiveSeries]);

  return (
    <AppLayout
      activeLanguage={activeLanguage}
      onLanguageChange={(languageValue) => {
        void i18n.changeLanguage(languageValue);
      }}
      onOpenSettings={openSettings}
      appMode={appMode}
      userEmail={userEmail}
      onSignOut={() => {
        void onSignOut();
      }}
      onChangeAppMode={(nextMode) => {
        void onChangeAppMode(nextMode);
      }}
      t={t}
      importInputRef={importInputRef}
      onFileChange={onFileChange}
      overview={
        <GlobalWealthSummary
          totalWealthCents={globalWealthSummary.totalWealthCents}
          balanceCents={globalWealthSummary.balanceCents}
          portfolioCents={globalWealthSummary.portfolioCents}
          hasInvestmentPortfolio={hasInvestmentPortfolio}
        />
      }
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
          readOnly={readOnly}
          t={t}
        />
      }
      dialogs={
        <>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            onChange={onJsonBackupFileChange}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
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
            appMode={appMode}
            userEmail={userEmail}
            onChangeAppMode={(nextMode) => {
              void onChangeAppMode(nextMode);
            }}
            currentPath={currentPath}
            defaultPath={defaultPath}
            inputPath={inputPath}
            isDefaultPath={isDefaultPath}
            loading={isDatabasePathLoading}
            error={databasePathError}
            readOnly={readOnly}
            onToggleReadOnly={toggleReadOnly}
            hasInvestmentPortfolio={hasInvestmentPortfolio}
            onToggleInvestmentPortfolio={(value) => {
              void setHasInvestmentPortfolio(value);
            }}
            updateStatus={updateStatus}
            isOnline={isOnline}
            currentVersion={currentVersion}
            latestVersion={latestVersion}
            latestReleaseUrl={latestReleaseUrl}
            exportingCsv={exportingCsv}
            exportingSql={exportingSql}
            exportingJson={exportingJson}
            importingJson={importingJson}
            backingUp={backingUp}
            exportStatus={exportStatus}
            backupStatus={backupStatus}
            onInputChange={handleDatabasePathInputChange}
            onBrowse={browsePath}
            onSave={saveSettings}
            onReset={resetSettings}
            onCheckUpdates={checkForUpdates}
            onExportCsv={exportCsv}
            onExportSql={exportSql}
            onExportJson={exportJson}
            onImportJson={openJsonImport}
            onBackupDatabase={backupDatabase}
            onClose={closeSettings}
          />
        </>
      }
      toast={toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    >
      <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
      {activeTab === 'month' ? (
        <div
          className={`grid gap-4 transition duration-150 ease-out sm:gap-6 ${monthMotionClassName}`}
          {...monthSwipeHandlers}
        >
          <MonthView
            monthValue={monthValue}
            setMonthValue={setMonthValue}
            currentMonthValue={currentMonthValue}
            isCurrentMonth={isCurrentMonth}
            displaySummary={displaySummary}
            form={form}
            onFormChange={handleChange}
            onSubmit={handleSubmit}
            saving={saving}
            error={error}
            readOnly={readOnly}
            hasInvestmentPortfolio={hasInvestmentPortfolio}
            onOpenSettings={openSettings}
            onMobileFormOpenChange={setMonthSwipeBlocked}
          />
          <InsightsPanel
            title={monthInsights.title}
            comparisons={monthInsights.comparisons}
            emptyLabel={monthInsights.emptyLabel}
            currentLabel={monthInsights.currentLabel}
            previousLabel={monthInsights.previousLabel}
            hasAnyData={monthInsights.hasAnyData}
          />
        </div>
      ) : null}
      {activeTab === 'year' ? (
        <YearView
          yearValue={yearValue}
          setYearValue={setYearValue}
          currentYearValue={currentYearValue}
          isCurrentYear={isCurrentYear}
          availableYears={availableYears}
          comparisonYears={yearComparisonYears}
          yearComparisonValue={yearComparisonValue}
          setYearComparisonValue={setYearComparisonValue}
          yearTotals={yearTotals}
          yearSeriesVisibility={effectiveYearSeriesVisibility}
          toggleYearSeries={toggleYearSeries}
          showOnlyYearSeries={showOnlyYearSeries}
          hasInvestmentPortfolio={hasInvestmentPortfolio}
          hasChartData={hasChartData}
          yearChartData={yearChartData}
          yearWealthChartData={yearWealthChartData}
          yearChartOptions={yearChartOptions}
          sortedYearSeries={sortedYearSeries}
          yearTableSort={yearTableSort}
          handleYearSort={handleYearSort}
          yearTrendByMonth={yearTrendByMonth}
          yearInsights={yearInsights}
        />
      ) : null}
      {activeTab === 'all' ? (
        <HistoryView
          allYearsSeriesVisibility={effectiveAllYearsSeriesVisibility}
          toggleAllYearsSeries={toggleAllYearsSeries}
          showOnlyAllYearsSeries={showOnlyAllYearsSeries}
          hasInvestmentPortfolio={hasInvestmentPortfolio}
          hasAllYearsData={hasAllYearsData}
          allYearsChartData={allYearsChartData}
          allYearsWealthChartData={allYearsWealthChartData}
          allYearsChartOptions={allYearsChartOptions}
          sortedAllYears={sortedAllYears}
          allYearsTableSort={allYearsTableSort}
          handleAllYearsSort={handleAllYearsSort}
          allYearsTrendByYear={allYearsTrendByYear}
        />
      ) : null}
      </Suspense>
    </AppLayout>
  );
}
