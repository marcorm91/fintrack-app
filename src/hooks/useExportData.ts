import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { dirname, join } from '@tauri-apps/api/path';
import { confirm, save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { checkpointDatabase, getMonthlySeries } from '../db';
import type { MonthlySnapshotInput } from '../db';
import {
  BackupParseError,
  buildJsonBackup,
  parseJsonBackup,
  summarizeBackupImport
} from '../utils/backup';
import { buildCsvSnapshots, buildSqlDump } from '../utils/export';

type ExportTone = 'success' | 'error';

export type ExportStatus = {
  tone: ExportTone;
  message: string;
} | null;

export type BackupStatus = ExportStatus;

type UseExportDataOptions = {
  currentPath: string;
  language: string;
  currentVersion: string | null;
  hasInvestmentPortfolio: boolean;
  readOnly: boolean;
  saveSnapshot: (snapshot: MonthlySnapshotInput) => Promise<void>;
  setInvestmentPortfolioEnabled: (enabled: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function getExportFileName(extension: 'csv' | 'sql' | 'json') {
  const date = new Date().toISOString().slice(0, 10);
  return `fintrack-${date}.${extension}`;
}

function getBackupFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `fintrack-backup-${date}.db`;
}

async function resolveDefaultExportPath(currentPath: string, fileName: string) {
  if (!currentPath) {
    return fileName;
  }
  try {
    const dir = await dirname(currentPath);
    return await join(dir, fileName);
  } catch {
    return fileName;
  }
}

function formatExportError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

async function writeExportFile(path: string, contents: string) {
  await writeTextFile(path, contents);
}

export function useExportData({
  currentPath,
  language,
  currentVersion,
  hasInvestmentPortfolio,
  readOnly,
  saveSnapshot,
  setInvestmentPortfolioEnabled,
  refreshData,
  t
}: UseExportDataOptions) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingSql, setExportingSql] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [sharingJson, setSharingJson] = useState(false);
  const [importingJson, setImportingJson] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const exportCsv = useCallback(async () => {
    setExportStatus(null);
    setBackupStatus(null);
    setExportingCsv(true);
    try {
      const series = await getMonthlySeries();
      const csv = buildCsvSnapshots(series, language);
      const defaultPath = await resolveDefaultExportPath(currentPath, getExportFileName('csv'));
      const path = await save({
        title: t('settings.exportCsvTitle'),
        defaultPath,
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      });
      if (!path) {
        return;
      }
      await writeExportFile(path, csv);
      setExportStatus({ tone: 'success', message: t('settings.exportCsvSuccess', { path }) });
    } catch (error) {
      setExportStatus({ tone: 'error', message: formatExportError(error, t('settings.exportError')) });
    } finally {
      setExportingCsv(false);
    }
  }, [currentPath, language, t]);

  const exportSql = useCallback(async () => {
    setExportStatus(null);
    setBackupStatus(null);
    setExportingSql(true);
    try {
      const series = await getMonthlySeries();
      const sql = buildSqlDump(series);
      const defaultPath = await resolveDefaultExportPath(currentPath, getExportFileName('sql'));
      const path = await save({
        title: t('settings.exportSqlTitle'),
        defaultPath,
        filters: [{ name: 'SQL', extensions: ['sql'] }]
      });
      if (!path) {
        return;
      }
      await writeExportFile(path, sql);
      setExportStatus({ tone: 'success', message: t('settings.exportSqlSuccess', { path }) });
    } catch (error) {
      setExportStatus({ tone: 'error', message: formatExportError(error, t('settings.exportError')) });
    } finally {
      setExportingSql(false);
    }
  }, [currentPath, t]);

  const exportJson = useCallback(async () => {
    setExportStatus(null);
    setBackupStatus(null);
    setExportingJson(true);
    try {
      const series = await getMonthlySeries();
      const json = buildJsonBackup(series, hasInvestmentPortfolio, currentVersion ?? 'unknown');
      const defaultPath = await resolveDefaultExportPath(currentPath, getExportFileName('json'));
      const path = await save({
        title: t('settings.exportJsonTitle'),
        defaultPath,
        filters: [{ name: 'Fintrack JSON', extensions: ['json'] }]
      });
      if (!path) {
        return;
      }
      await writeExportFile(path, json);
      setBackupStatus({ tone: 'success', message: t('settings.exportJsonSuccess', { path }) });
    } catch (error) {
      setBackupStatus({ tone: 'error', message: formatExportError(error, t('settings.backupError')) });
    } finally {
      setExportingJson(false);
    }
  }, [currentPath, currentVersion, hasInvestmentPortfolio, t]);

  const shareJson = useCallback(async () => {
    setExportStatus(null);
    setBackupStatus(null);
    setSharingJson(true);
    try {
      const series = await getMonthlySeries();
      const json = buildJsonBackup(series, hasInvestmentPortfolio, currentVersion ?? 'unknown');
      const fileName = getExportFileName('json');
      const file = new File([json], fileName, { type: 'application/json' });
      const shareData = {
        title: fileName,
        text: t('settings.shareJsonText'),
        files: [file]
      };
      if (
        typeof navigator === 'undefined' ||
        typeof navigator.share !== 'function' ||
        (typeof navigator.canShare === 'function' && !navigator.canShare(shareData))
      ) {
        await exportJson();
        return;
      }
      await navigator.share(shareData);
      setBackupStatus({ tone: 'success', message: t('settings.shareJsonSuccess') });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setBackupStatus({ tone: 'error', message: formatExportError(error, t('settings.shareJsonError')) });
    } finally {
      setSharingJson(false);
    }
  }, [currentVersion, exportJson, hasInvestmentPortfolio, t]);

  const openJsonImport = useCallback(() => {
    if (readOnly || importingJson) {
      return;
    }
    setBackupStatus(null);
    setExportStatus(null);
    backupInputRef.current?.click();
  }, [importingJson, readOnly]);

  const onJsonBackupFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) {
        return;
      }
      if (readOnly) {
        setBackupStatus({ tone: 'error', message: t('settings.backupImportReadOnly') });
        return;
      }
      setImportingJson(true);
      setBackupStatus(null);
      try {
        const backup = parseJsonBackup(await file.text());
        const currentSeries = await getMonthlySeries();
        const importSummary = summarizeBackupImport(currentSeries, backup.snapshots);
        const confirmed = await confirm(
          t('settings.backupImportConfirmMessage', {
            count: backup.snapshots.length,
            version: backup.appVersion,
            newCount: importSummary.newCount,
            changedCount: importSummary.changedCount,
            unchangedCount: importSummary.unchangedCount
          }),
          { title: t('settings.backupImportConfirmTitle') }
        );
        if (!confirmed) {
          return;
        }
        for (const snapshot of backup.snapshots) {
          await saveSnapshot(snapshot);
        }
        await setInvestmentPortfolioEnabled(backup.investmentPortfolioEnabled);
        await refreshData();
        setBackupStatus({
          tone: 'success',
          message: t('settings.backupImportSuccess', { count: backup.snapshots.length })
        });
      } catch (error) {
        const message =
          error instanceof BackupParseError
            ? t(error.translationKey)
            : formatExportError(error, t('settings.backupImportError'));
        setBackupStatus({ tone: 'error', message });
      } finally {
        setImportingJson(false);
      }
    },
    [readOnly, refreshData, saveSnapshot, setInvestmentPortfolioEnabled, t]
  );

  const backupDatabase = useCallback(async () => {
    setBackupStatus(null);
    setExportStatus(null);
    setBackingUp(true);
    try {
      if (!currentPath) {
        setBackupStatus({ tone: 'error', message: t('settings.backupMissingPath') });
        return;
      }
      const defaultPath = await resolveDefaultExportPath(currentPath, getBackupFileName());
      const path = await save({
        title: t('settings.backupTitle'),
        defaultPath,
        filters: [{ name: 'Database', extensions: ['db'] }]
      });
      if (!path) {
        return;
      }
      await checkpointDatabase();
      await invoke('backup_database_file', { source: currentPath, destination: path });
      setBackupStatus({ tone: 'success', message: t('settings.backupSuccess', { path }) });
    } catch (error) {
      setBackupStatus({ tone: 'error', message: formatExportError(error, t('settings.backupError')) });
    } finally {
      setBackingUp(false);
    }
  }, [currentPath, t]);

  return {
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
  };
}
