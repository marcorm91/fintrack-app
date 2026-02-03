import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMonthValue, getMonthLabel, getMonthLabels, getMonthParts } from '../utils/date';

export function MonthPicker({
  value,
  label,
  onChange,
  className = '',
  buttonClassName = '',
  labelClassName = '',
  iconClassName = ''
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const [open, setOpen] = useState(false);
  const { year, month } = getMonthParts(value);
  const [viewYear, setViewYear] = useState(year);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const monthLabels = getMonthLabels(locale);

  useEffect(() => {
    if (open) {
      setViewYear(year);
    }
  }, [open, year]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={`relative ${className}`.trim()} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        title={label}
        className={`flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-base text-ink shadow-sm focus:border-accent focus:outline-none sm:px-4 sm:text-sm ${buttonClassName}`.trim()}
      >
        <span className={labelClassName}>
          {getMonthLabel(value, locale)} {year}
        </span>
        <svg className={`h-4 w-4 text-muted ${iconClassName}`.trim()} viewBox="0 0 20 20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1.5A1.5 1.5 0 0 1 18 5.5v11A1.5 1.5 0 0 1 16.5 18h-13A1.5 1.5 0 0 1 2 16.5v-11A1.5 1.5 0 0 1 3.5 4H5V3a1 1 0 0 1 1-1zm10 7H4v7.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V9zM5 6H4.5a.5.5 0 0 0-.5.5V7h12v-.5a.5.5 0 0 0-.5-.5H15v1a1 1 0 1 1-2 0V6H7v1a1 1 0 1 1-2 0V6z"
          />
        </svg>
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 w-56 rounded-2xl border border-ink/10 bg-white p-3 shadow-card sm:w-64 sm:p-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((prev) => prev - 1)}
              className="rounded-full border border-ink/10 bg-white px-2 py-1 text-sm text-muted"
            >
              -
            </button>
            <span className="text-sm font-semibold text-ink">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((prev) => prev + 1)}
              className="rounded-full border border-ink/10 bg-white px-2 py-1 text-sm text-muted"
            >
              +
            </button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
            {monthLabels.map((labelText, index) => {
              const monthIndex = index + 1;
              const selected = viewYear === year && monthIndex === month;
              return (
                <button
                  key={labelText}
                  type="button"
                  onClick={() => {
                    onChange(formatMonthValue(viewYear, monthIndex));
                    setOpen(false);
                  }}
                  className={`rounded-lg px-2 py-2 text-[10px] uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.16em] ${
                    selected
                      ? 'bg-accent text-white'
                      : 'border border-ink/10 text-muted hover:border-accent'
                  }`}
                >
                  {labelText}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
