import type { ImportScope, TabKey } from '../types';
import { TABS } from '../constants';
import { TabActions } from './TabActions';

type TabsBarProps = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
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

export function TabsBar({
  activeTab,
  setActiveTab,
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
}: TabsBarProps) {
  return (
    <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-3">
      <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition md:w-auto ${
                isActive
                  ? 'bg-accent text-white shadow-md'
                  : 'border border-ink/10 bg-white/70 text-muted hover:shadow-sm'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>
      <TabActions
        activeTab={activeTab}
        monthValue={monthValue}
        yearValue={yearValue}
        importMenuOpen={importMenuOpen}
        toggleImportMenu={toggleImportMenu}
        openFileImport={openFileImport}
        openTextImport={openTextImport}
        setInfoScope={setInfoScope}
        closeImportMenu={closeImportMenu}
        openDeleteMonth={openDeleteMonth}
        openDeleteYear={openDeleteYear}
        openDeleteAll={openDeleteAll}
        importing={importing}
        deletingMonth={deletingMonth}
        deletingYear={deletingYear}
        deletingAll={deletingAll}
        t={t}
      />
    </div>
  );
}
