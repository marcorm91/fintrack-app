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
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
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
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
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
      <div className="w-full max-w-xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={8}
          className="mt-4 w-full resize-y rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
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
  updateStatus,
  isOnline,
  currentVersion,
  latestVersion,
  latestReleaseUrl,
  exportingCsv,
  exportingSql,
  exportStatus,
  onInputChange,
  onBrowse,
  onSave,
  onReset,
  onCheckUpdates,
  onExportCsv,
  onExportSql,
  onClose
}: {
  open: boolean;
  currentPath: string;
  defaultPath: string;
  inputPath: string;
  isDefaultPath: boolean;
  loading: boolean;
  error: string | null;
  updateStatus: UpdateStatus;
  isOnline: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
  latestReleaseUrl: string | null;
  exportingCsv: boolean;
  exportingSql: boolean;
  exportStatus: ExportStatus;
  onInputChange: (value: string) => void;
  onBrowse: () => void;
  onSave: () => boolean;
  onReset: () => void;
  onCheckUpdates: () => void;
  onExportCsv: () => void;
  onExportSql: () => void;
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
      <div className="flex flex-col relative w-full min-h-[700px] max-w-xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
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
        <div className="mt-4 mr-auto inline-flex rounded-full border border-ink/10 bg-white p-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
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
            <div className="mt-4 space-y-3 text-xs text-muted">
              <div>
                <span className="uppercase tracking-[0.18em]">{t('settings.currentPath')}</span>
                <div className="mt-1 rounded-lg bg-ink/5 px-3 py-2 text-[11px] text-ink">
                  {resolvedCurrent}
                  {isDefaultPath ? ` (${t('settings.defaultBadge')})` : ''}
                </div>
              </div>
              <div>
                <span className="uppercase tracking-[0.18em]">{t('settings.defaultPath')}</span>
                <div className="mt-1 rounded-lg bg-ink/5 px-3 py-2 text-[11px] text-ink">
                  {resolvedDefault}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onReset}
                disabled={loading}
                className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('settings.useDefault')}
              </button>
            </div>
            <label className="mt-5 flex flex-col gap-2 text-sm text-muted uppercase tracking-[0.18em]">
              {t('settings.inputLabel')}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={inputPath}
                  onChange={(event) => onInputChange(event.target.value)}
                  placeholder={t('settings.inputPlaceholder')}
                  className="tracking-normal text-xs min-w-[220px] flex-1 rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onBrowse}
                  disabled={loading}
                  className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('settings.browse')}
                </button>
              </div>
              <span className="text-xs text-muted normal-case tracking-normal">{t('settings.inputHelp')}</span>
            </label>
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
                    className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exportingCsv ? t('settings.exportingCsv') : t('settings.exportCsv')}
                  </button>
                  <button
                    type="button"
                    onClick={onExportSql}
                    disabled={exportDisabled}
                    className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exportingSql ? t('settings.exportingSql') : t('settings.exportSql')}
                  </button>
                </div>
              </div>
              {exportStatus ? (
                <p className={`mt-3 text-xs ${exportStatusClass}`}>{exportStatus.message}</p>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={loading}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('settings.savePath')}
              </button>
            </div>
            {pathStatus ? (
              <p className={`mt-3 text-xs ${pathStatusClass}`}>{pathStatus.message}</p>
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
                  className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="inline-flex rounded-full border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
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
