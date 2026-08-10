import { useEffect, useRef } from 'react';
import type { ImportScope } from '../types';
import { DotsVerticalIcon } from './icons';

type TabActionsProps = {
  activeTab: ImportScope;
  monthValue: string;
  yearValue: string;
  importMenuOpen: ImportScope | null;
  toggleImportMenu: (scope: ImportScope) => void;
  openFileImport: (scope: ImportScope) => void;
  openTextImport: (scope: ImportScope) => void;
  closeImportMenu: () => void;
  openDeleteMonth: (month: string) => void;
  openDeleteYear: (year: string) => void;
  openDeleteAll: () => void;
  importing: boolean;
  deletingMonth: boolean;
  deletingYear: boolean;
  deletingAll: boolean;
  readOnly: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

type ImportMenuProps = {
  scope: ImportScope;
  importMenuOpen: ImportScope | null;
  toggleImportMenu: (scope: ImportScope) => void;
  closeImportMenu: () => void;
  openFileImport: (scope: ImportScope) => void;
  openTextImport: (scope: ImportScope) => void;
  disabled: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function ImportMenu({
  scope,
  importMenuOpen,
  toggleImportMenu,
  closeImportMenu,
  openFileImport,
  openTextImport,
  disabled,
  t
}: ImportMenuProps) {
  const isOpen = importMenuOpen === scope;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeImportMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeImportMenu();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeImportMenu, isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => toggleImportMenu(scope)}
        disabled={disabled}
        aria-label={t('actions.importOptions')}
        title={t('actions.importOptions')}
        className="btn btn-neutral btn-icon text-ink"
      >
        <DotsVerticalIcon />
      </button>
      {isOpen ? (
        <div className="absolute left-0 z-30 mt-2 w-48 rounded-xl border border-ink/10 bg-white p-2 shadow-card sm:left-auto sm:right-0">
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
  closeImportMenu,
  openDeleteMonth,
  openDeleteYear,
  openDeleteAll,
  importing,
  deletingMonth,
  deletingYear,
  deletingAll,
  readOnly,
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
      deleteLabelKey: 'actions.deleteHistory',
      deleting: deletingAll,
      onDelete: openDeleteAll
    }
  };

  const activeConfig = actionConfig[activeTab];
  if (!activeConfig) {
    return null;
  }

  const importDisabled = importing || activeConfig.deleting || readOnly;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted sm:text-xs sm:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ImportMenu
          scope={activeConfig.scope}
          importMenuOpen={importMenuOpen}
          toggleImportMenu={toggleImportMenu}
          closeImportMenu={closeImportMenu}
          openFileImport={openFileImport}
          openTextImport={openTextImport}
          disabled={importDisabled}
          t={t}
        />
      </div>
      <button
        type="button"
        onClick={activeConfig.onDelete}
        disabled={importDisabled}
        className="btn btn-danger px-3 sm:px-4"
      >
        {activeConfig.deleting ? t('actions.deleting') : t(activeConfig.deleteLabelKey)}
      </button>
    </div>
  );
}
