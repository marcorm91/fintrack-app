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
};

export function useMonthlyData({ loadErrorMessage }: UseMonthlyDataOptions = {}) {
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

  const saveSnapshot = useCallback(async (snapshot: MonthlySnapshotInput) => {
    await saveMonthlySnapshot(snapshot);
  }, []);

  const deleteMonth = useCallback(async (month: string) => {
    await deleteMonthlySnapshot(month);
  }, []);

  const deleteYear = useCallback(async (year: string) => {
    await deleteMonthlySnapshotsForYear(year);
  }, []);

  const deleteAll = useCallback(async () => {
    await deleteAllMonthlySnapshots();
  }, []);

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
