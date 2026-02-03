import type { ImportScope, TabKey } from '../types';
import { TABS } from '../constants';
import { useIsMobile } from '../hooks/useIsMobile';
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
  readOnly: boolean;
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
  readOnly,
  t
}: TabsBarProps) {
  const isMobile = useIsMobile();

  const tabButtons = TABS.map((tab) => {
    const isActive = activeTab === tab.key;
    return (
      <button
        key={tab.key}
        type="button"
        onClick={() => setActiveTab(tab.key)}
        className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition sm:text-xs sm:tracking-[0.18em] ${
          isActive
            ? 'bg-accent text-white shadow-md'
            : 'border border-ink/10 bg-white/70 text-muted hover:shadow-sm'
        }`}
      >
        {t(tab.labelKey)}
      </button>
    );
  });

  if (isMobile) {
    return (
      <>
        <div className="mt-2 flex w-full flex-wrap items-center gap-2">
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
          readOnly={readOnly}
          t={t}
        />
      </div>
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full items-center justify-between gap-2 px-3 pt-2 pb-[calc(var(--app-safe-bottom)+0.75rem)] sm:px-4 md:px-6">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-2xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                    isActive ? 'bg-ink/5 text-ink' : 'text-muted'
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  return (
    <div className="mt-3 flex w-full flex-col gap-3 md:mt-4 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-auto md:flex-wrap md:pb-0">
        {tabButtons}
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
        readOnly={readOnly}
        t={t}
      />
    </div>
  );
}
