import type { ImportScope } from '../types';

type TabActionsProps = {
  activeTab: ImportScope;
  monthValue: string;
  yearValue: string;
  openDeleteMonth: (month: string) => void;
  openDeleteYear: (year: string) => void;
  openDeleteAll: () => void;
  deletingMonth: boolean;
  deletingYear: boolean;
  deletingAll: boolean;
  readOnly: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function TabActions({
  activeTab,
  monthValue,
  yearValue,
  openDeleteMonth,
  openDeleteYear,
  openDeleteAll,
  deletingMonth,
  deletingYear,
  deletingAll,
  readOnly,
  t
}: TabActionsProps) {
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
  const deleteDisabled = activeConfig.deleting || readOnly;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted sm:text-xs sm:gap-4">
      <button
        type="button"
        onClick={activeConfig.onDelete}
        disabled={deleteDisabled}
        className="btn btn-danger px-3 sm:px-4"
      >
        {activeConfig.deleting ? t('actions.deleting') : t(activeConfig.deleteLabelKey)}
      </button>
    </div>
  );
}
