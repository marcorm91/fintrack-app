import { useEffect } from 'react';
import type { ImportScope } from '../types';
import { DotsVerticalIcon, InfoIcon } from './icons';

type TabActionsProps = {
  activeTab: ImportScope;
  monthValue: string;
  yearValue: string;
  importMenuOpen: ImportScope | null;
  toggleImportMenu: (scope: ImportScope) => void;
  openFileImport: (scope: ImportScope) => void;
  openTextImport: (scope: ImportScope) => void;
  setInfoScope: (scope: ImportScope | null) => void;
  closeImportMenu: () => void;
  openDeleteMonth: (month: string) => void;
  openDeleteYear: (year: string) => void;
  openDeleteAll: () => void;
  importing: boolean;
  deletingMonth: boolean;
  deletingYear: boolean;
  deletingAll: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

type ImportMenuProps = {
  scope: ImportScope;
  importMenuOpen: ImportScope | null;
  toggleImportMenu: (scope: ImportScope) => void;
  openFileImport: (scope: ImportScope) => void;
  openTextImport: (scope: ImportScope) => void;
  disabled: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function ImportMenu({
  scope,
  importMenuOpen,
  toggleImportMenu,
  openFileImport,
  openTextImport,
  disabled,
  t
}: ImportMenuProps) {
  const isOpen = importMenuOpen === scope;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => toggleImportMenu(scope)}
        disabled={disabled}
        aria-label={t('actions.importOptions')}
        title={t('actions.importOptions')}
        className="rounded-full border border-accent/30 bg-white/80 p-2 text-accent shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        <DotsVerticalIcon />
      </button>
      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-ink/10 bg-white p-2 shadow-card">
          <button
            type="button"
            onClick={() => openFileImport(scope)}
            className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
          >
            {t('actions.importCsv')}
          </button>
          <button
            type="button"
            onClick={() => openTextImport(scope)}
            className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
          >
            {t('actions.pasteData')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TabActions({
  activeTab,
  monthValue,
  yearValue,
  importMenuOpen,
  toggleImportMenu,
  openFileImport,
  openTextImport,
  setInfoScope,
  closeImportMenu,
  openDeleteMonth,
  openDeleteYear,
  openDeleteAll,
  importing,
  deletingMonth,
  deletingYear,
  deletingAll,
  t
}: TabActionsProps) {
  useEffect(() => {
    closeImportMenu();
  }, [activeTab, closeImportMenu]);

  const actionConfig: Record<
    ImportScope,
    { scope: ImportScope; deleteLabelKey: string; deleting: boolean; onDelete: () => void }
  > = {
    month: {
      scope: 'month',
      deleteLabelKey: 'actions.deleteMonth',
      deleting: deletingMonth,
      onDelete: () => openDeleteMonth(monthValue)
    },
    year: {
      scope: 'year',
      deleteLabelKey: 'actions.deleteYear',
      deleting: deletingYear,
      onDelete: () => openDeleteYear(yearValue)
    },
    all: {
      scope: 'all',
      deleteLabelKey: 'actions.deleteAll',
      deleting: deletingAll,
      onDelete: openDeleteAll
    }
  };

  const activeConfig = actionConfig[activeTab];
  if (!activeConfig) {
    return null;
  }

  const importDisabled = importing || activeConfig.deleting;

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
      <div className="flex items-center gap-2">
        <ImportMenu
          scope={activeConfig.scope}
          importMenuOpen={importMenuOpen}
          toggleImportMenu={toggleImportMenu}
          openFileImport={openFileImport}
          openTextImport={openTextImport}
          disabled={importDisabled}
          t={t}
        />
        <button
          type="button"
          onClick={() => setInfoScope(activeConfig.scope)}
          className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted shadow-sm transition hover:border-accent hover:text-ink"
        >
          <InfoIcon />
          <span>{t('actions.info')}</span>
        </button>
      </div>
      <button
        type="button"
        onClick={activeConfig.onDelete}
        disabled={importDisabled}
        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        {activeConfig.deleting ? t('actions.deleting') : t(activeConfig.deleteLabelKey)}
      </button>
    </div>
  );
}
