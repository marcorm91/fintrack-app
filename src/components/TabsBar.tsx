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
        aria-current={isActive ? 'page' : undefined}
        className={`segmented-option whitespace-nowrap ${isActive ? 'segmented-option-active' : ''}`}
      >
        {t(tab.labelKey)}
      </button>
    );
  });

  if (isMobile) {
    return (
      <>
        <div className="mt-3 flex w-full flex-wrap items-center gap-2">
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
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/5 bg-white/95 shadow-[0_-16px_40px_-32px_rgba(33,48,71,0.35)] backdrop-blur">
          <div className="mx-auto px-3 pt-2 pb-[calc(var(--app-safe-bottom)+0.75rem)] sm:px-4 md:px-6">
            <div className="segmented grid w-full grid-cols-3">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`segmented-option px-3 text-[10px] tracking-[0.12em] ${
                      isActive ? 'segmented-option-active' : ''
                    }`}
                  >
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </>
    );
  }

  return (
    <div className="mt-4 flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="segmented w-full overflow-x-auto md:w-auto md:overflow-visible">
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
