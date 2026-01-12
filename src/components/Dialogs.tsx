import type React from 'react';
import { useTranslation } from 'react-i18next';
import type { UpdateStatus } from '../hooks/useUpdateStatus';

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
  content: React.ReactNode;
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
  onInputChange,
  onBrowse,
  onSave,
  onReset,
  onCheckUpdates,
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
  onInputChange: (value: string) => void;
  onBrowse: () => void;
  onSave: () => void;
  onReset: () => void;
  onCheckUpdates: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!open) {
    return null;
  }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card">
        <h3 className="text-lg font-semibold text-ink">{t('settings.title')}</h3>
        <p className="mt-2 text-sm text-muted">{t('settings.description')}</p>
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
        <label className="mt-5 flex flex-col gap-2 text-sm text-muted">
          {t('settings.inputLabel')}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={inputPath}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={t('settings.inputPlaceholder')}
              className="min-w-[220px] flex-1 rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
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
          <span className="text-xs text-muted">{t('settings.inputHelp')}</span>
        </label>
        {errorMessage ? (
          <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
        ) : null}
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
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('settings.useDefault')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
          >
            {t('actions.close')}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('settings.savePath')}
          </button>
        </div>
      </div>
    </div>
  );
}

