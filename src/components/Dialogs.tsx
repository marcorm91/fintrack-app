import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { confirm } from '@tauri-apps/plugin-dialog';
import { open as openExternal } from '@tauri-apps/plugin-shell';
import type { UpdateStatus } from '../hooks/useUpdateStatus';
import type { ExportStatus } from '../hooks/useExportData';
import type { AppMode } from '../hooks/useAppMode';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-ink/10 bg-white p-4 shadow-card sm:p-6">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-neutral text-xs"
          >
            {t('actions.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary text-xs"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InfoDialog({
  open,
  title,
  content,
  onClose
}: {
  open: boolean;
  title: string;
  content: ReactNode;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-ink/10 bg-white p-4 shadow-card sm:p-6">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <div className="mt-3 text-sm text-muted">{content}</div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-neutral text-xs"
          >
            {t('actions.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TextImportDialog({
  open,
  title,
  description,
  placeholder,
  value,
  onChange,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  if (!open) {
    return null;
  }

  const isEmpty = value.trim().length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-ink/10 bg-white p-4 shadow-card sm:p-6">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={8}
          className="mt-4 w-full resize-y rounded-xl border border-ink/10 bg-white px-3 py-2 text-base text-ink shadow-sm focus:border-accent focus:outline-none sm:text-sm"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-neutral text-xs"
          >
            {t('actions.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isEmpty}
            className="btn btn-primary text-xs"
          >
            {t('actions.prepareImport')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DatabaseSettingsDialog({
  open,
  appMode,
  userEmail,
  onChangeAppMode,
  currentPath,
  inputPath,
  isDefaultPath,
  loading,
  error,
  readOnly,
  onToggleReadOnly,
  hasInvestmentPortfolio,
  onToggleInvestmentPortfolio,
  updateStatus,
  isOnline,
  currentVersion,
  latestVersion,
  latestReleaseUrl,
  exportingCsv,
  exportingSql,
  exportingJson,
  importingJson,
  backingUp,
  exportStatus,
  backupStatus,
  onInputChange,
  onBrowse,
  onSave,
  onReset,
  onCheckUpdates,
  onExportCsv,
  onExportSql,
  onExportJson,
  onImportJson,
  onBackupDatabase,
  onClose
}: {
  open: boolean;
  appMode: AppMode;
  userEmail: string | null;
  onChangeAppMode: (mode: AppMode) => void;
  currentPath: string;
  inputPath: string;
  isDefaultPath: boolean;
  loading: boolean;
  error: string | null;
  readOnly: boolean;
  onToggleReadOnly: (value: boolean) => void;
  hasInvestmentPortfolio: boolean;
  onToggleInvestmentPortfolio: (value: boolean) => void;
  updateStatus: UpdateStatus;
  isOnline: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
  latestReleaseUrl: string | null;
  exportingCsv: boolean;
  exportingSql: boolean;
  exportingJson: boolean;
  importingJson: boolean;
  backingUp: boolean;
  exportStatus: ExportStatus;
  backupStatus: ExportStatus;
  onInputChange: (value: string) => void;
  onBrowse: () => void;
  onSave: () => boolean;
  onReset: () => void;
  onCheckUpdates: () => void;
  onExportCsv: () => void;
  onExportSql: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onBackupDatabase: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const resolvedCurrent = currentPath || t('settings.unknownPath');
  const errorMessage = error ? t(error) : null;
  const resolvedCurrentVersion = currentVersion ?? t('settings.updateUnknown');
  const resolvedLatestVersion = latestVersion ?? t('settings.updateUnknown');
  let updateMessage = t('settings.updateIdle');
  if (updateStatus === 'checking') {
    updateMessage = t('settings.updateChecking');
  }
  if (updateStatus === 'upToDate') {
    updateMessage = t('settings.updateUpToDate');
  }
  if (updateStatus === 'updateAvailable') {
    updateMessage = t('settings.updateAvailable', { version: resolvedLatestVersion });
  }
  if (updateStatus === 'error') {
    updateMessage = t('settings.updateError');
  }
  const updateActionLabel =
    updateStatus === 'checking' ? t('settings.updateChecking') : t('settings.checkUpdates');
  const exportStatusClass =
    exportStatus?.tone === 'error' ? 'text-red-700' : 'text-benefit';
  const exportDisabled = loading || exportingCsv || exportingSql;
  const backupDisabled = loading || backingUp || exportingJson || importingJson;
  const [pathStatus, setPathStatus] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const hasUnsavedChanges = inputPath.trim() !== currentPath;
  const handleExternalLink = async (event: MouseEvent<HTMLAnchorElement>, url: string) => {
    event.preventDefault();
    await openExternal(url);
  };
  const handleClose = async () => {
    if (hasUnsavedChanges) {
      const confirmed = await confirm(t('settings.closeConfirmMessage'), {
        title: t('settings.closeConfirmTitle')
      });
      if (!confirmed) {
        return;
      }
    }
    onClose();
  };
  const handleSave = async () => {
    setPathStatus(null);
    if (!hasUnsavedChanges) {
      setPathStatus({ tone: 'info', message: t('settings.noChanges') });
      return;
    }
    const confirmed = await confirm(t('settings.saveConfirmMessage'), {
      title: t('settings.saveConfirmTitle')
    });
    if (!confirmed) {
      return;
    }
    const saved = onSave();
    if (saved) {
      setPathStatus({ tone: 'success', message: t('settings.saveSuccess') });
    } else {
      setPathStatus({ tone: 'error', message: t('settings.saveError') });
    }
  };
  const pathStatusClass =
    pathStatus?.tone === 'error'
      ? 'text-red-700'
      : pathStatus?.tone === 'success'
        ? 'text-benefit'
        : 'text-muted';

  useEffect(() => {
    setPathStatus(null);
  }, [inputPath]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="flex flex-col relative w-full min-h-[70vh] max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl border border-ink/10 bg-white p-4 shadow-card sm:min-h-[700px] sm:p-6">
        <button
          type="button"
          onClick={() => void handleClose()}
          aria-label={t('actions.close')}
          className="btn btn-neutral btn-icon absolute right-4 top-4 text-muted hover:text-ink"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h3 className="pr-12 text-lg font-semibold text-ink">{t('settings.title')}</h3>
        <p className="mt-1 pr-12 text-xs leading-5 text-muted">{t('settings.description')}</p>

        <div className="mt-5 space-y-4">
          <section className="rounded-2xl border border-ink/10 bg-ink/5 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-ink">{t('settings.storageModeTitle')}</h4>
                  <span className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {t(
                      appMode === 'local'
                        ? 'settings.storageModeLocal'
                        : 'settings.storageModeCloud'
                    )}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {t(
                    appMode === 'local'
                      ? 'settings.storageModeLocalDescription'
                      : 'settings.storageModeCloudDescription'
                  )}
                </p>
                {appMode === 'cloud' && userEmail ? (
                  <p className="mt-2 truncate text-xs text-ink" title={userEmail}>
                    {t('settings.storageModeAccount', { email: userEmail })}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onChangeAppMode(appMode === 'local' ? 'cloud' : 'local')}
                className={`btn shrink-0 text-[10px] sm:text-[11px] ${
                  appMode === 'local' ? 'btn-primary' : 'btn-neutral'
                }`}
              >
                {t(appMode === 'local' ? 'settings.enableCloud' : 'settings.useLocal')}
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted">{t('settings.storageModeSafety')}</p>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white px-4 py-4">
            <h4 className="text-sm font-semibold text-ink">{t('settings.preferencesTitle')}</h4>
            <p className="mt-1 text-xs text-muted">{t('settings.preferencesDescription')}</p>
            <div className="mt-3 divide-y divide-ink/10">
              <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-xs font-semibold text-ink">
                    {t('settings.investmentPortfolioTitle')}
                  </span>
                  <span className="mt-1 block text-[11px] leading-5 text-muted">
                    {t('settings.investmentPortfolioDescription')}
                  </span>
                </span>
                <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={hasInvestmentPortfolio}
                    onChange={(event) => onToggleInvestmentPortfolio(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-ink/10 transition peer-checked:bg-ink" />
                  <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                </span>
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-xs font-semibold text-ink">{t('settings.readOnlyTitle')}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-muted">
                    {t('settings.readOnlyDescription')}
                  </span>
                </span>
                <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={readOnly}
                    onChange={(event) => onToggleReadOnly(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-ink/10 transition peer-checked:bg-ink" />
                  <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-ink/5 px-4 py-4">
            <h4 className="text-sm font-semibold text-ink">{t('settings.dataManagementTitle')}</h4>
            <p className="mt-1 text-xs leading-5 text-muted">{t('settings.dataManagementDescription')}</p>
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {t('settings.fullBackupTitle')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onExportJson}
                  disabled={backupDisabled}
                  className="btn btn-primary text-[10px] sm:text-[11px]"
                >
                  {exportingJson ? t('settings.exportingJson') : t('settings.exportJson')}
                </button>
                <button
                  type="button"
                  onClick={onImportJson}
                  disabled={backupDisabled || readOnly}
                  className="btn btn-neutral text-[10px] sm:text-[11px]"
                >
                  {importingJson ? t('settings.importingJson') : t('settings.importJson')}
                </button>
              </div>
            </div>
            <div className="mt-4 border-t border-ink/10 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {t('settings.otherFormatsTitle')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onExportCsv}
                  disabled={exportDisabled}
                  className="btn btn-neutral text-[10px] sm:text-[11px]"
                >
                  {exportingCsv ? t('settings.exportingCsv') : t('settings.exportCsv')}
                </button>
                <button
                  type="button"
                  onClick={onExportSql}
                  disabled={exportDisabled}
                  className="btn btn-neutral text-[10px] sm:text-[11px]"
                >
                  {exportingSql ? t('settings.exportingSql') : t('settings.exportSql')}
                </button>
                <button
                  type="button"
                  onClick={onBackupDatabase}
                  disabled={backupDisabled}
                  className="btn btn-neutral text-[10px] sm:text-[11px]"
                >
                  {backingUp ? t('settings.backupRunning') : t('settings.backupDatabaseAction')}
                </button>
              </div>
            </div>
            {exportStatus ? (
              <p className={`mt-3 text-xs ${exportStatusClass}`}>{exportStatus.message}</p>
            ) : null}
            {backupStatus ? (
              <p
                className={`mt-3 text-xs ${
                  backupStatus.tone === 'error' ? 'text-red-700' : 'text-benefit'
                }`}
              >
                {backupStatus.message}
              </p>
            ) : null}
          </section>

          <details className="group rounded-2xl border border-ink/10 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
              <span>
                <span className="block text-sm font-semibold text-ink">{t('settings.databaseLocationTitle')}</span>
                <span className="mt-1 block text-xs text-muted">
                  {t('settings.databaseLocationDescription')}
                </span>
              </span>
              <svg
                className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M3.5 6l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="border-t border-ink/10 px-4 pb-4 pt-4">
              <div className="space-y-3 text-[10px] text-muted sm:text-xs">
                <div>
                  <span className="uppercase tracking-[0.16em]">{t('settings.currentPath')}</span>
                  <div className="mt-1 flex min-w-0 items-center gap-2 rounded-lg bg-ink/5 px-3 py-2 text-[11px] text-ink">
                    <span className="min-w-0 flex-1 truncate" title={resolvedCurrent}>
                      {resolvedCurrent}
                    </span>
                    {isDefaultPath ? (
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted">
                        {t('settings.defaultBadge')}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <label className="mt-4 flex flex-col gap-2 text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs">
                {t('settings.inputLabel')}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={inputPath}
                    onChange={(event) => onInputChange(event.target.value)}
                    placeholder={t('settings.inputPlaceholder')}
                    className="min-w-[220px] flex-1 truncate rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-[11px] tracking-normal text-ink focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={onBrowse}
                    disabled={loading}
                    className="btn btn-neutral text-[9px] sm:text-[10px]"
                  >
                    {t('settings.browse')}
                  </button>
                </div>
                <span className="text-[10px] normal-case tracking-normal text-muted sm:text-xs">
                  {t('settings.inputHelp')}
                </span>
              </label>
              {errorMessage ? (
                <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={loading}
                  className="btn btn-primary text-[10px] sm:text-xs"
                >
                  {t('settings.savePath')}
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  disabled={loading}
                  className="btn btn-neutral text-[10px] sm:text-xs"
                >
                  {t('settings.useDefault')}
                </button>
              </div>
              {pathStatus ? (
                <p className={`mt-3 text-xs ${pathStatusClass}`}>{pathStatus.message}</p>
              ) : null}
            </div>
          </details>

          <section className="rounded-2xl border border-ink/10 bg-white px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-ink">{t('settings.aboutTitle')}</h4>
                <p className="mt-1 text-xs text-muted">
                  {t('settings.currentVersion')}: <span className="text-ink">{resolvedCurrentVersion}</span>
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {t(isOnline ? 'settings.updateStatusOnline' : 'settings.updateStatusOffline')}
                </p>
              </div>
              <button
                type="button"
                onClick={onCheckUpdates}
                disabled={!isOnline || updateStatus === 'checking'}
                className="btn btn-neutral text-[10px] sm:text-[11px]"
              >
                {updateActionLabel}
              </button>
            </div>
            {updateStatus !== 'idle' ? (
              <p className="mt-3 text-xs text-ink">{updateMessage}</p>
            ) : null}
            {updateStatus === 'updateAvailable' ? (
              <p className="mt-1 text-xs text-muted">
                {t('settings.latestVersion')}: <span className="text-ink">{resolvedLatestVersion}</span>
              </p>
            ) : null}
            {updateStatus === 'updateAvailable' && latestReleaseUrl ? (
              <a
                href={latestReleaseUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-neutral mt-3 text-[10px] sm:text-[11px]"
              >
                {t('settings.openRelease')}
              </a>
            ) : null}
          </section>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4 text-xs text-muted">
          <span>{t('settings.authorLabel')}</span>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/marcorm91"
              onClick={(event) => handleExternalLink(event, 'https://github.com/marcorm91')}
              className="font-semibold text-ink transition hover:text-muted"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/marcorm91/"
              onClick={(event) => handleExternalLink(event, 'https://www.linkedin.com/in/marcorm91/')}
              className="font-semibold text-ink transition hover:text-muted"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
