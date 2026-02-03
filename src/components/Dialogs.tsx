import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { confirm } from '@tauri-apps/plugin-dialog';
import { open as openExternal } from '@tauri-apps/plugin-shell';
import type { UpdateStatus } from '../hooks/useUpdateStatus';
import type { ExportStatus } from '../hooks/useExportData';

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
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
          >
            {t('actions.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:shadow-md"
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
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
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
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
          >
            {t('actions.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isEmpty}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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
  currentPath,
  defaultPath,
  inputPath,
  isDefaultPath,
  loading,
  error,
  readOnly,
  onToggleReadOnly,
  updateStatus,
  isOnline,
  currentVersion,
  latestVersion,
  latestReleaseUrl,
  exportingCsv,
  exportingSql,
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
  onBackupDatabase,
  onClose
}: {
  open: boolean;
  currentPath: string;
  defaultPath: string;
  inputPath: string;
  isDefaultPath: boolean;
  loading: boolean;
  error: string | null;
  readOnly: boolean;
  onToggleReadOnly: (value: boolean) => void;
  updateStatus: UpdateStatus;
  isOnline: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
  latestReleaseUrl: string | null;
  exportingCsv: boolean;
  exportingSql: boolean;
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
  onBackupDatabase: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'data' | 'updates'>('data');
  const resolvedCurrent = currentPath || t('settings.unknownPath');
  const resolvedDefault = defaultPath || t('settings.unknownPath');
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
  const backupDisabled = loading || backingUp;
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
          className="absolute right-4 top-4 rounded-full border border-ink/10 bg-white p-2 text-muted shadow-sm transition hover:border-accent hover:text-ink"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-ink">{t('settings.title')}</h3>
        <div className="mt-4 mr-auto inline-flex rounded-full border border-ink/10 bg-white p-1 text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-[11px] sm:tracking-[0.18em]">
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`rounded-full px-4 py-2 transition ${
              activeTab === 'data' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {t('settings.tabsData')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`rounded-full px-4 py-2 transition ${
              activeTab === 'updates' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {t('settings.tabsUpdates')}
          </button>
        </div>
        {activeTab === 'data' ? (
          <>
            <div className="mt-4 space-y-3 text-[10px] text-muted sm:text-xs">
              <div>
                <span className="uppercase tracking-[0.18em]">{t('settings.currentPath')}</span>
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
              <div>
                <span className="uppercase tracking-[0.18em]">{t('settings.defaultPath')}</span>
                <div className="mt-1 rounded-lg bg-ink/5 px-3 py-2 text-[11px] text-ink">
                  <span className="block w-full truncate" title={resolvedDefault}>
                    {resolvedDefault}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onReset}
                disabled={loading}
                className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs sm:tracking-[0.18em]"
              >
                {t('settings.useDefault')}
              </button>
            </div>
            <label className="mt-5 flex flex-col gap-2 text-[10px] text-muted uppercase tracking-[0.18em] sm:text-xs">
              {t('settings.inputLabel')}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={inputPath}
                  onChange={(event) => onInputChange(event.target.value)}
                  placeholder={t('settings.inputPlaceholder')}
                  className="tracking-normal text-[11px] min-w-[220px] flex-1 rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-ink focus:border-accent focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={onBrowse}
                  disabled={loading}
                  className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-[10px] sm:tracking-[0.18em]"
                >
                  {t('settings.browse')}
                </button>
              </div>
              <span className="text-[10px] text-muted normal-case tracking-normal sm:text-xs">
                {t('settings.inputHelp')}
              </span>
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white px-3 py-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink">
                  {t('settings.readOnlyTitle')}
                </p>
                <p className="mt-1 text-[10px] text-muted sm:text-xs">{t('settings.readOnlyDescription')}</p>
              </div>
              <label className="relative inline-flex h-6 w-11 items-center">
                <input
                  type="checkbox"
                  checked={readOnly}
                  onChange={(event) => onToggleReadOnly(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-ink/10 transition peer-checked:bg-accent" />
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
            </div>
            {errorMessage ? (
              <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
            ) : null}
            <div className="mt-6 rounded-2xl border border-ink/10 bg-ink/5 px-4 py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{t('settings.exportTitle')}</p>
                  <p className="text-xs text-muted">{t('settings.exportDescription')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onExportCsv}
                    disabled={exportDisabled}
                    className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px] sm:tracking-[0.18em]"
                  >
                    {exportingCsv ? t('settings.exportingCsv') : t('settings.exportCsv')}
                  </button>
                  <button
                    type="button"
                    onClick={onExportSql}
                    disabled={exportDisabled}
                    className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px] sm:tracking-[0.18em]"
                  >
                    {exportingSql ? t('settings.exportingSql') : t('settings.exportSql')}
                  </button>
                </div>
              </div>
              {exportStatus ? (
                <p className={`mt-3 text-xs ${exportStatusClass}`}>{exportStatus.message}</p>
              ) : null}
            </div>
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white px-4 py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{t('settings.backupTitle')}</p>
                  <p className="text-xs text-muted">{t('settings.backupDescription')}</p>
                </div>
                <button
                  type="button"
                  onClick={onBackupDatabase}
                  disabled={backupDisabled}
                  className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px] sm:tracking-[0.18em]"
                >
                  {backingUp ? t('settings.backupRunning') : t('settings.backupAction')}
                </button>
              </div>
              {backupStatus ? (
                <p
                  className={`mt-3 text-xs ${
                    backupStatus.tone === 'error' ? 'text-red-700' : 'text-benefit'
                  }`}
                >
                  {backupStatus.message}
                </p>
              ) : null}
            </div>
            <div className="mt-6 mb-3 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={loading}
                className="rounded-full bg-accent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs sm:tracking-[0.18em]"
              >
                {t('settings.savePath')}
              </button>
            </div>
            {pathStatus ? (
              <p className={`mt-3 mb-3 text-xs ${pathStatusClass}`}>{pathStatus.message}</p>
            ) : null}
          </>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-ink/10 bg-ink/5 px-4 py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{t('settings.updatesTitle')}</p>
                  <p className="text-xs text-muted">
                    {t(isOnline ? 'settings.updateStatusOnline' : 'settings.updateStatusOffline')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCheckUpdates}
                  disabled={!isOnline || updateStatus === 'checking'}
                  className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px] sm:tracking-[0.18em]"
                >
                  {updateActionLabel}
                </button>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-muted">
                <span>
                  {t('settings.currentVersion')}: <span className="text-ink">{resolvedCurrentVersion}</span>
                </span>
                <span>
                  {t('settings.latestVersion')}: <span className="text-ink">{resolvedLatestVersion}</span>
                </span>
                <span className="text-ink">{updateMessage}</span>
              </div>
              {updateStatus === 'updateAvailable' && latestReleaseUrl ? (
                <div className="mt-3">
                  <a
                    href={latestReleaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-ink/10 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm transition hover:border-accent hover:text-ink sm:text-[11px] sm:tracking-[0.18em]"
                  >
                    {t('settings.openRelease')}
                  </a>
                </div>
              ) : null}
            </div>
          </>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4 text-xs text-muted">
          <span>{t('settings.authorLabel')}</span>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/marcorm91"
              onClick={(event) => handleExternalLink(event, 'https://github.com/marcorm91')}
              className="font-semibold text-ink transition hover:text-accent"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/marcorm91/"
              onClick={(event) => handleExternalLink(event, 'https://www.linkedin.com/in/marcorm91/')}
              className="font-semibold text-ink transition hover:text-accent"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
