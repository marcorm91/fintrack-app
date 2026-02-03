import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { dirname, join } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { getMonthlySeries } from '../db';
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
  t: (key: string, options?: Record<string, unknown>) => string;
};

function getExportFileName(extension: 'csv' | 'sql') {
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

export function useExportData({ currentPath, language, t }: UseExportDataOptions) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingSql, setExportingSql] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(null);

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
      await invoke('write_text_file', { path, contents: csv });
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
      await invoke('write_text_file', { path, contents: sql });
      setExportStatus({ tone: 'success', message: t('settings.exportSqlSuccess', { path }) });
    } catch (error) {
      setExportStatus({ tone: 'error', message: formatExportError(error, t('settings.exportError')) });
    } finally {
      setExportingSql(false);
    }
  }, [currentPath, t]);

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
      await invoke('copy_file', { source: currentPath, destination: path });
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
    backupDatabase,
    exportingCsv,
    exportingSql,
    backingUp,
    exportStatus,
    backupStatus
  };
}
