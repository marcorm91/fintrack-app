import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useCloudSync } from './hooks/useCloudSync';
import { useDatabaseAccess } from './hooks/useDatabaseAccess';
import { useOfflinePin } from './hooks/useOfflinePin';
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
import { DATABASE_PATH_CHANGED_EVENT } from './db';
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
  const modeChangeInProgressRef = useRef(false);
  const [offlineUnlocked, setOfflineUnlocked] = useState(false);
  const { mode, setMode } = useAppMode();
  const {
    policy: databaseAccessPolicy,
    loading: databaseAccessLoading,
    error: databaseAccessError,
    claimForCloudUser,
    releaseToLocal,
    clearError: clearDatabaseAccessError,
    reload: reloadDatabaseAccess
  } = useDatabaseAccess();
  const {
    configured: offlinePinConfigured,
    loading: offlinePinLoading,
    configure: configureOfflinePin,
    disable: disableOfflinePin,
    verify: verifyOfflinePin
  } = useOfflinePin();
  const {
    user,
    loading,
    initializationError,
    signIn,
    requestPasswordReset,
    signOut
  } = useAuthSession(mode === 'cloud');

  useEffect(() => {
    if (
      !databaseAccessLoading &&
      databaseAccessPolicy?.mode === 'cloud' &&
      mode !== 'cloud'
    ) {
      setMode('cloud');
    }
  }, [databaseAccessLoading, databaseAccessPolicy, mode, setMode]);

  useEffect(() => {
    if (
      mode !== 'cloud' ||
      !user ||
      databaseAccessLoading ||
      databaseAccessError ||
      modeChangeInProgressRef.current ||
      !databaseAccessPolicy ||
      (databaseAccessPolicy.mode === 'cloud' && databaseAccessPolicy.ownerUid === user.uid)
    ) {
      return;
    }
    void claimForCloudUser(user.uid);
  }, [
    claimForCloudUser,
    databaseAccessError,
    databaseAccessLoading,
    databaseAccessPolicy,
    mode,
    user
  ]);

  useEffect(() => {
    if (databaseAccessError === 'owner-mismatch' && user) {
      void signOut();
    }
  }, [databaseAccessError, signOut, user]);

  useEffect(() => {
    if (user || mode !== 'cloud') {
      setOfflineUnlocked(false);
    }
  }, [mode, user]);

  useEffect(() => {
    const handleDatabasePathChange = () => setOfflineUnlocked(false);
    window.addEventListener(DATABASE_PATH_CHANGED_EVENT, handleDatabasePathChange);
    return () => {
      window.removeEventListener(DATABASE_PATH_CHANGED_EVENT, handleDatabasePathChange);
    };
  }, []);

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      clearDatabaseAccessError();
      await signIn(email, password);
    },
    [clearDatabaseAccessError, signIn]
  );

  const handleAppModeChange = useCallback(
    async (nextMode: AppMode) => {
      if (nextMode === 'local' && user) {
        modeChangeInProgressRef.current = true;
        try {
          const released = await releaseToLocal(user.uid);
          if (!released) {
            return;
          }
          setMode(nextMode);
          try {
            await signOut();
          } catch {
            // Local mode must remain available even if Firebase cannot respond.
          }
        } finally {
          modeChangeInProgressRef.current = false;
        }
        return;
      }
      setMode(nextMode);
    },
    [releaseToLocal, setMode, signOut, user]
  );

  useEffect(() => {
    const accessScreenVisible = mode === null || (mode === 'cloud' && !loading && !user);
    if (!accessScreenVisible) {
      return;
    }
    return dismissSplash();
  }, [loading, mode, user]);

  if (databaseAccessLoading || offlinePinLoading) {
    return null;
  }
  if (!databaseAccessPolicy || databaseAccessError === 'unavailable') {
    return <DatabaseAccessErrorScreen onRetry={() => void reloadDatabaseAccess()} />;
  }
  if (databaseAccessPolicy.mode === 'cloud' && mode !== 'cloud') {
    return null;
  }
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
  if (mode === 'cloud' && !user && !offlineUnlocked) {
    return (
      <AuthScreen
        initializationError={initializationError}
        accessError={databaseAccessError}
        offlinePinConfigured={
          databaseAccessPolicy.mode === 'cloud' && offlinePinConfigured
        }
        onSignIn={handleSignIn}
        onRequestPasswordReset={requestPasswordReset}
        onUnlockOffline={async (pin) => {
          const result = await verifyOfflinePin(pin);
          if (result.status === 'success') {
            setOfflineUnlocked(true);
          }
          return result;
        }}
        onUseLocal={
          databaseAccessPolicy.mode === 'local'
            ? () => {
                void handleAppModeChange('local');
              }
            : undefined
        }
      />
    );
  }

  if (
    mode === 'cloud' &&
    user &&
    !(
      databaseAccessPolicy.mode === 'cloud' &&
      databaseAccessPolicy.ownerUid === user.uid
    )
  ) {
    return null;
  }

  return (
    <FintrackApp
      appMode={mode}
      userId={mode === 'cloud' ? (user?.uid ?? null) : null}
      userEmail={mode === 'cloud' ? (user?.email ?? null) : null}
      offlineAccess={mode === 'cloud' && offlineUnlocked && !user}
      offlinePinConfigured={offlinePinConfigured}
      onConfigureOfflinePin={configureOfflinePin}
      onDisableOfflinePin={disableOfflinePin}
      onSignOut={
        offlineUnlocked
          ? async () => {
              setOfflineUnlocked(false);
            }
          : signOut
      }
      onChangeAppMode={handleAppModeChange}
    />
  );
}

function DatabaseAccessErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink/5 px-4">
      <section className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 text-center shadow-card sm:p-8">
        <img src="/app-icon.svg" alt="" className="mx-auto h-16 w-16 rounded-2xl shadow-sm" />
        <h1 className="mt-5 text-xl font-semibold text-ink">{t('auth.databaseUnavailableTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{t('auth.databaseUnavailableDescription')}</p>
        <button type="button" onClick={onRetry} className="btn btn-primary mt-6 w-full justify-center py-3">
          {t('actions.retry')}
        </button>
      </section>
    </div>
  );
}

function FintrackApp({
  appMode,
  userId,
  userEmail,
  offlineAccess,
  offlinePinConfigured,
  onConfigureOfflinePin,
  onDisableOfflinePin,
  onSignOut,
  onChangeAppMode
}: {
  appMode: AppMode;
  userId: string | null;
  userEmail: string | null;
  offlineAccess: boolean;
  offlinePinConfigured: boolean;
  onConfigureOfflinePin: (pin: string) => Promise<void>;
  onDisableOfflinePin: () => Promise<void>;
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
  const {
    status: cloudSyncStatus,
    syncNow: syncCloudNow,
    resolveConflicts: resolveCloudSyncConflicts
  } = useCloudSync({
    enabled: appMode === 'cloud' && !offlineAccess,
    userId,
    onRemoteChange: refreshData
  });
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
    inputPath,
    isDefaultPath,
    canChangePath: canChangeDatabasePath,
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
    shareJson,
    openJsonImport,
    onJsonBackupFileChange,
    backupInputRef,
    backupDatabase,
    exportingCsv,
    exportingSql,
    exportingJson,
    sharingJson,
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
  const canShareJsonBackup = useMemo(() => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      return false;
    }
    return /Android/i.test(navigator.userAgent);
  }, []);
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
      offlineAccess={offlineAccess}
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
            offlineAccess={offlineAccess}
            offlinePinConfigured={offlinePinConfigured}
            onConfigureOfflinePin={onConfigureOfflinePin}
            onDisableOfflinePin={onDisableOfflinePin}
            onChangeAppMode={(nextMode) => {
              void onChangeAppMode(nextMode);
            }}
            cloudSyncStatus={cloudSyncStatus}
            onSyncNow={() => {
              void syncCloudNow();
            }}
            onResolveSyncConflicts={resolveCloudSyncConflicts}
            currentPath={currentPath}
            inputPath={inputPath}
            isDefaultPath={isDefaultPath}
            canChangeDatabasePath={canChangeDatabasePath}
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
            canShareJson={canShareJsonBackup}
            sharingJson={sharingJson}
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
            onShareJson={shareJson}
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
