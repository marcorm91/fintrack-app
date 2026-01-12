import { useCallback, useState } from 'react';
import type { SeriesKey } from '../types';

export type SeriesVisibility = Record<SeriesKey, boolean>;

const buildAllVisibility = (): SeriesVisibility => ({
  income: true,
  expense: true,
  balance: true,
  benefit: true
});

const buildSoloVisibility = (key: SeriesKey): SeriesVisibility => ({
  income: key === 'income',
  expense: key === 'expense',
  balance: key === 'balance',
  benefit: key === 'benefit'
});

const toggleSoloVisibility = (prev: SeriesVisibility, key: SeriesKey): SeriesVisibility => {
  const keys = Object.keys(prev) as SeriesKey[];
  const isOnlyVisible = keys.every((seriesKey) =>
    seriesKey === key ? prev[seriesKey] : !prev[seriesKey]
  );
  return isOnlyVisible ? buildAllVisibility() : buildSoloVisibility(key);
};

export function useSeriesVisibility() {
  const [visibility, setVisibility] = useState<SeriesVisibility>(buildAllVisibility);

  const toggleSeries = useCallback((key: SeriesKey) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const showOnlySeries = useCallback((key: SeriesKey) => {
    setVisibility((prev) => toggleSoloVisibility(prev, key));
  }, []);

  return {
    visibility,
    toggleSeries,
    showOnlySeries
  };
}
