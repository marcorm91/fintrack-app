import { useCallback, useState } from 'react';
import {
  deleteAllMonthlySnapshots,
  deleteMonthlySnapshot,
  deleteMonthlySnapshotsForYear,
  getMonthlySeries,
  getMonthlySummary,
  saveMonthlySnapshot,
  type MonthlySeriesPoint,
  type MonthlySnapshotInput,
  type MonthlySummary
} from '../db';
export type { MonthlySnapshotInput } from '../db';

type UseMonthlyDataOptions = {
  loadErrorMessage?: string;
  readOnly?: boolean;
};

export function useMonthlyData({ loadErrorMessage, readOnly = false }: UseMonthlyDataOptions = {}) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [series, setSeries] = useState<MonthlySeriesPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fallbackMessage = loadErrorMessage ?? 'Error cargando datos';

  const refresh = useCallback(
    async (monthValue: string) => {
      setLoading(true);
      setError(null);
      try {
        const [nextSummary, nextSeries] = await Promise.all([
          getMonthlySummary(monthValue),
          getMonthlySeries()
        ]);
        setSummary(nextSummary);
        setSeries(nextSeries);
      } catch (err) {
        const message = err instanceof Error ? err.message : fallbackMessage;
        setError(message || fallbackMessage);
      } finally {
        setLoading(false);
      }
    },
    [fallbackMessage]
  );

  const saveSnapshot = useCallback(
    async (snapshot: MonthlySnapshotInput) => {
      if (readOnly) {
        return;
      }
      await saveMonthlySnapshot(snapshot);
    },
    [readOnly]
  );

  const deleteMonth = useCallback(
    async (month: string) => {
      if (readOnly) {
        return;
      }
      await deleteMonthlySnapshot(month);
    },
    [readOnly]
  );

  const deleteYear = useCallback(
    async (year: string) => {
      if (readOnly) {
        return;
      }
      await deleteMonthlySnapshotsForYear(year);
    },
    [readOnly]
  );

  const deleteAll = useCallback(
    async () => {
      if (readOnly) {
        return;
      }
      await deleteAllMonthlySnapshots();
    },
    [readOnly]
  );

  return {
    summary,
    series,
    loading,
    error,
    refresh,
    saveSnapshot,
    deleteMonth,
    deleteYear,
    deleteAll,
    setError
  };
}
