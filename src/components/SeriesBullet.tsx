import type { SeriesKey } from '../types';

const SERIES_BULLET_CLASS: Record<SeriesKey, string> = {
  income: 'bg-income',
  expense: 'bg-expense',
  benefit: 'bg-benefit',
  balance: 'bg-balance',
  portfolio: 'bg-portfolio',
  totalWealth: 'bg-totalWealth'
};

type SeriesBulletProps = {
  seriesKey: SeriesKey;
  valueCents?: number;
  className?: string;
};

export function SeriesBullet({ seriesKey, className = '' }: SeriesBulletProps) {
  if (seriesKey === 'benefit') {
    return (
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
        style={{ background: 'linear-gradient(90deg, #22b984 0 50%, #f05268 50% 100%)' }}
      />
    );
  }

  const colorClass = SERIES_BULLET_CLASS[seriesKey];

  return <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClass} ${className}`} />;
}
