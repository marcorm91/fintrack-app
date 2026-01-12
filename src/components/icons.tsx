import type { BalanceTrend } from '../types';

type TrendIconDirection = BalanceTrend | 'right';
type TrendIconProps = {
  trend: TrendIconDirection;
  colorClass?: string;
};

export function TrendIcon({ trend, colorClass }: TrendIconProps) {
  const defaultColorClass =
    trend === 'right'
      ? 'text-ink'
      : trend === 'up'
        ? 'text-benefit'
        : trend === 'down'
          ? 'text-benefitNegative'
          : 'text-muted';
  const resolvedColorClass = colorClass ?? defaultColorClass;
  const path =
    trend === 'right'
      ? 'M13 8l-4-4v3H3v2h6v3l4-4z'
      : trend === 'up'
        ? 'M8 3l4 4H9v6H7V7H4l4-4z'
        : trend === 'down'
          ? 'M8 13l-4-4h3V3h2v6h3l-4 4z'
          : 'M4 8h8v2H4z';

  return (
    <svg className={`h-4 w-4 ${resolvedColorClass}`} viewBox="0 0 16 16" aria-hidden="true">
      <path d={path} fill="currentColor" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function DotsVerticalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="3" r="1.4" fill="currentColor" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="8" cy="13" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d=" M9.24 5.35 L10.40 1.93 L13.60 1.93 L14.76 5.35 L18.00 3.75 L20.25 6.00 L18.65 9.24 L22.07 10.40 L22.07 13.60 L18.65 14.76 L20.25 18.00 L18.00 20.25 L14.76 18.65 L13.60 22.07 L10.40 22.07 L9.24 18.65 L6.00 20.25 L3.75 18.00 L5.35 14.76 L1.93 13.60 L1.93 10.40 L5.35 9.24 L3.75 6.00 L6.00 3.75 Z " />
        <circle cx="12" cy="12" r="3.2" />
      </g>
    </svg>
  );
}

export function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const path = direction === 'left' ? 'M10.5 3.5L6 8l4.5 4.5' : 'M5.5 3.5L10 8l-4.5 4.5';
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
