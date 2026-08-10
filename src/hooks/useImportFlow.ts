import { useCallback, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ToastTone } from '../types';
import type { MonthlySnapshotInput } from './useMonthlyData';

type ConfirmAction =
  | { type: 'import'; snapshots: MonthlySnapshotInput[]; fileName: string }
  | { type: 'delete-month'; month: string }
  | { type: 'delete-year'; year: string }
  | { type: 'delete-all' };

type ConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
};

type TextImportDetails = {
  title: string;
  description: string;
  placeholder: string;
};

type UseImportFlowOptions = {
  t: (key: string, options?: Record<string, unknown>) => string;
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
  t,
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
  const [fileImportPending, setFileImportPending] = useState(false);
  const [textImportOpen, setTextImportOpen] = useState(false);
  const [textImportValue, setTextImportValue] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [importing, setImporting] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);
  const [deletingYear, setDeletingYear] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const openFileImport = useCallback(() => {
    setFileImportPending(true);
    importInputRef.current?.click();
  }, []);

  const openTextImport = useCallback(() => {
    setTextImportOpen(true);
    setTextImportValue('');
  }, []);

  const closeTextImport = useCallback(() => {
    setTextImportOpen(false);
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
        setFileImportPending(false);
        return;
      }
      if (!fileImportPending) {
        setError(t('errors.importType'));
        event.target.value = '';
        return;
      }
      setError(null);
      setImporting(true);
      try {
        const snapshots = parseCsvSnapshots(await file.text());
        setConfirmAction({ type: 'import', snapshots, fileName: file.name });
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
        setFileImportPending(false);
      }
    },
    [fileImportPending, parseCsvSnapshots, setError, t]
  );

  const confirmTextImport = useCallback(() => {
    if (!textImportOpen) {
      return;
    }
    setError(null);
    try {
      const snapshots = parseCsvSnapshots(textImportValue);
      setConfirmAction({
        type: 'import',
        snapshots,
        fileName: t('imports.pastedLabel')
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
  }, [closeTextImport, parseCsvSnapshots, setError, t, textImportOpen, textImportValue]);

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
        onToast?.({ message: t('messages.deletedMonth', { month: confirmAction.month }), tone: 'danger' });
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
        onToast?.({ message: t('messages.deletedYear', { year: confirmAction.year }), tone: 'danger' });
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
        onToast?.({ message: t('messages.deletedAll'), tone: 'danger' });
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
    if (!textImportOpen) {
      return null;
    }
    return {
      title: t('imports.text.all.title'),
      description: t('imports.text.all.description'),
      placeholder: t('imports.text.all.placeholder')
    };
  }, [t, textImportOpen]);

  const confirmDialog = useMemo<ConfirmDialog | null>(() => {
    if (!confirmAction) {
      return null;
    }
    if (confirmAction.type === 'import') {
      return {
        title: t('dialogs.confirmImportTitle'),
        message: t('dialogs.confirmImportMessage', {
          count: confirmAction.snapshots.length,
          fileName: confirmAction.fileName
        }),
        confirmLabel: t('actions.import')
      };
    }
    if (confirmAction.type === 'delete-month') {
      return {
        title: t('dialogs.confirmDeleteMonthTitle'),
        message: t('dialogs.confirmDeleteMonthMessage', { month: confirmAction.month }),
        confirmLabel: t('dialogs.confirmDeleteMonthCta')
      };
    }
    if (confirmAction.type === 'delete-year') {
      return {
        title: t('dialogs.confirmDeleteYearTitle'),
        message: t('dialogs.confirmDeleteYearMessage', { year: confirmAction.year }),
        confirmLabel: t('dialogs.confirmDeleteYearCta')
      };
    }
    return {
      title: t('dialogs.confirmDeleteAllTitle'),
      message: t('dialogs.confirmDeleteAllMessage'),
      confirmLabel: t('dialogs.confirmDeleteAllCta')
    };
  }, [confirmAction, t]);

  return {
    importInputRef,
    textImportOpen,
    textImportValue,
    setTextImportValue,
    confirmAction,
    confirmDialog,
    textImportDetails,
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
