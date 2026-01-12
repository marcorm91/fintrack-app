import { useCallback, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ImportScope, ToastTone } from '../types';
import type { MonthlySnapshotInput } from './useMonthlyData';

type ConfirmAction =
  | { type: 'import'; snapshots: MonthlySnapshotInput[]; fileName: string; scope: ImportScope }
  | { type: 'delete-month'; month: string }
  | { type: 'delete-year'; year: string }
  | { type: 'delete-all' };

type ConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
};

type InfoDialog = {
  title: string;
  lines: string[];
  examples: string[];
};

type TextImportDetails = {
  title: string;
  description: string;
  placeholder: string;
};

type UseImportFlowOptions = {
  monthValue: string;
  yearValue: string;
  language: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  parseMonthCsv: (text: string, month: string) => MonthlySnapshotInput[];
  parseCsvSnapshots: (text: string) => MonthlySnapshotInput[];
  saveSnapshot: (snapshot: MonthlySnapshotInput) => Promise<void>;
  deleteMonth: (month: string) => Promise<void>;
  deleteYear: (year: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  refreshData: () => Promise<void>;
  setError: (message: string | null) => void;
  onToast?: (toast: { message: string; tone: ToastTone } | null) => void;
  onMonthDeleted?: () => void;
};

export function useImportFlow({
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
  onToast,
  onMonthDeleted
}: UseImportFlowOptions) {
  const [importMenuOpen, setImportMenuOpen] = useState<ImportScope | null>(null);
  const [importScope, setImportScope] = useState<ImportScope | null>(null);
  const [textImportScope, setTextImportScope] = useState<ImportScope | null>(null);
  const [textImportValue, setTextImportValue] = useState('');
  const [infoScope, setInfoScope] = useState<ImportScope | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [importing, setImporting] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);
  const [deletingYear, setDeletingYear] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const translate = useCallback(
    (key: string, options?: Record<string, unknown>) => t(key, { ...options, lng: language }),
    [language, t]
  );

  const toggleImportMenu = useCallback((scope: ImportScope) => {
    setImportMenuOpen((prev) => (prev === scope ? null : scope));
  }, []);

  const closeImportMenu = useCallback(() => {
    setImportMenuOpen(null);
  }, []);

  const openFileImport = useCallback((scope: ImportScope) => {
    setImportScope(scope);
    setImportMenuOpen(null);
    importInputRef.current?.click();
  }, []);

  const openTextImport = useCallback((scope: ImportScope) => {
    setTextImportScope(scope);
    setTextImportValue('');
    setImportMenuOpen(null);
  }, []);

  const closeTextImport = useCallback(() => {
    setTextImportScope(null);
    setTextImportValue('');
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmAction(null);
  }, []);

  const openDeleteMonth = useCallback((month: string) => {
    setConfirmAction({ type: 'delete-month', month });
  }, []);

  const openDeleteYear = useCallback((year: string) => {
    setConfirmAction({ type: 'delete-year', year });
  }, []);

  const openDeleteAll = useCallback(() => {
    setConfirmAction({ type: 'delete-all' });
  }, []);

  const onFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setImportScope(null);
        return;
      }
      const scope = importScope;
      if (!scope) {
        setError(t('errors.importType'));
        event.target.value = '';
        return;
      }
      setError(null);
      setImporting(true);
      try {
        const text = await file.text();
        const snapshots =
          scope === 'month' ? parseMonthCsv(text, monthValue) : parseCsvSnapshots(text);
        setConfirmAction({ type: 'import', snapshots, fileName: file.name, scope });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : JSON.stringify(err);
        setError(message || t('errors.importFile'));
      } finally {
        setImporting(false);
        event.target.value = '';
        setImportScope(null);
      }
    },
    [importScope, monthValue, parseCsvSnapshots, parseMonthCsv, setError, t]
  );

  const confirmTextImport = useCallback(() => {
    if (!textImportScope) {
      return;
    }
    setError(null);
    try {
      const snapshots =
        textImportScope === 'month'
          ? parseMonthCsv(textImportValue, monthValue)
          : parseCsvSnapshots(textImportValue);
      setConfirmAction({
        type: 'import',
        snapshots,
        fileName: t('imports.pastedLabel'),
        scope: textImportScope
      });
      closeTextImport();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : JSON.stringify(err);
      setError(message || t('errors.importText'));
    }
  }, [closeTextImport, monthValue, parseCsvSnapshots, parseMonthCsv, setError, t, textImportScope, textImportValue]);

  const onConfirm = useCallback(async () => {
    if (!confirmAction) {
      return;
    }
    setError(null);
    if (confirmAction.type === 'import') {
      setImporting(true);
      try {
        for (const item of confirmAction.snapshots) {
          await saveSnapshot(item);
        }
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : JSON.stringify(err);
        setError(message || t('errors.importFile'));
      } finally {
        setImporting(false);
      }
    } else if (confirmAction.type === 'delete-month') {
      setDeletingMonth(true);
      try {
        await deleteMonth(confirmAction.month);
        onMonthDeleted?.();
        await refreshData();
        const message = t('messages.deletedMonth', { month: confirmAction.month });
        onToast?.({ message, tone: 'danger' });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : JSON.stringify(err);
        setError(message || t('errors.deleteMonth'));
      } finally {
        setDeletingMonth(false);
      }
    } else if (confirmAction.type === 'delete-year') {
      setDeletingYear(true);
      try {
        await deleteYear(confirmAction.year);
        await refreshData();
        const message = t('messages.deletedYear', { year: confirmAction.year });
        onToast?.({ message, tone: 'danger' });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : JSON.stringify(err);
        setError(message || t('errors.deleteYear'));
      } finally {
        setDeletingYear(false);
      }
    } else {
      setDeletingAll(true);
      try {
        await deleteAll();
        await refreshData();
        const message = t('messages.deletedAll');
        onToast?.({ message, tone: 'danger' });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : JSON.stringify(err);
        setError(message || t('errors.deleteAll'));
      } finally {
        setDeletingAll(false);
      }
    }

    setConfirmAction(null);
  }, [confirmAction, deleteAll, deleteMonth, deleteYear, onMonthDeleted, onToast, refreshData, saveSnapshot, setError, t]);

  const textImportDetails = useMemo<TextImportDetails | null>(() => {
    if (!textImportScope) {
      return null;
    }
    if (textImportScope === 'month') {
      return {
        title: translate('imports.text.month.title'),
        description: translate('imports.text.month.description'),
        placeholder: translate('imports.text.month.placeholder')
      };
    }
    if (textImportScope === 'year') {
      return {
        title: translate('imports.text.year.title', { year: yearValue }),
        description: translate('imports.text.year.description'),
        placeholder: translate('imports.text.year.placeholder')
      };
    }
    return {
      title: translate('imports.text.all.title'),
      description: translate('imports.text.all.description'),
      placeholder: translate('imports.text.all.placeholder')
    };
  }, [textImportScope, translate, yearValue]);

  const confirmDialog = useMemo<ConfirmDialog | null>(() => {
    if (!confirmAction) {
      return null;
    }
    if (confirmAction.type === 'import') {
      const scopeLabel =
        confirmAction.scope === 'month'
          ? translate('importScopes.month', { month: monthValue })
          : confirmAction.scope === 'year'
            ? translate('importScopes.year', { year: yearValue })
            : translate('importScopes.all');
      return {
        title: translate('dialogs.confirmImportTitle'),
        message: translate('dialogs.confirmImportMessage', {
          count: confirmAction.snapshots.length,
          scope: scopeLabel,
          fileName: confirmAction.fileName
        }),
        confirmLabel: translate('actions.import')
      };
    }
    if (confirmAction.type === 'delete-month') {
      return {
        title: translate('dialogs.confirmDeleteMonthTitle'),
        message: translate('dialogs.confirmDeleteMonthMessage', { month: confirmAction.month }),
        confirmLabel: translate('dialogs.confirmDeleteMonthCta')
      };
    }
    if (confirmAction.type === 'delete-year') {
      return {
        title: translate('dialogs.confirmDeleteYearTitle'),
        message: translate('dialogs.confirmDeleteYearMessage', { year: confirmAction.year }),
        confirmLabel: translate('dialogs.confirmDeleteYearCta')
      };
    }
    return {
      title: translate('dialogs.confirmDeleteAllTitle'),
      message: translate('dialogs.confirmDeleteAllMessage'),
      confirmLabel: translate('dialogs.confirmDeleteAllCta')
    };
  }, [confirmAction, monthValue, translate, yearValue]);

  const infoDialog = useMemo<InfoDialog | null>(() => {
    if (!infoScope) {
      return null;
    }
    if (infoScope === 'month') {
      return {
        title: translate('info.month.title'),
        lines: [translate('info.month.line1'), translate('info.month.line2')],
        examples: [translate('info.month.exampleHeader'), translate('info.month.exampleRow')]
      };
    }
    if (infoScope === 'year') {
      return {
        title: translate('info.year.title'),
        lines: [translate('info.year.line1'), translate('info.year.line2')],
        examples: [translate('info.year.exampleHeader'), translate('info.year.exampleRow')]
      };
    }
    return {
      title: translate('info.all.title'),
      lines: [translate('info.all.line1'), translate('info.all.line2')],
      examples: [
        translate('info.all.exampleHeader'),
        translate('info.all.exampleRow1'),
        translate('info.all.exampleRow2')
      ]
    };
  }, [infoScope, translate]);

  return {
    importInputRef,
    importMenuOpen,
    setImportMenuOpen,
    toggleImportMenu,
    closeImportMenu,
    textImportScope,
    textImportValue,
    setTextImportValue,
    infoScope,
    setInfoScope,
    confirmAction,
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
  };
}
