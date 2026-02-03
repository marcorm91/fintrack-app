import type { ChartType } from '../types';
import { useTranslation } from 'react-i18next';
import { CHART_TYPES } from '../constants';

export function ChartTypeToggle({
  value,
  onChange
}: {
  value: ChartType;
  onChange: (value: ChartType) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 p-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm sm:text-[10px]">
      {CHART_TYPES.map((type) => {
        const isActive = value === type.key;
        return (
          <button
            key={type.key}
            type="button"
            onClick={() => onChange(type.key)}
            aria-pressed={isActive}
            className={`rounded-full px-3 py-1 transition ${
              isActive ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {t(type.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
