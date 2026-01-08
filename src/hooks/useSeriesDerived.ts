import { useMemo } from 'react';
import type {
  AllTableSortKey,
  BalanceTrend,
  SortDirection,
  YearTableSortKey
} from '../types';
import type { MonthlySeriesPoint } from '../db';
import { buildYearSeries, getBalanceTrend } from '../utils/series';

export type AllYearsPoint = {
  year: string;
  incomeCents: number;
  expenseCents: number;
  benefitCents: number;
  balanceCents: number;
};

export type YearTotals = {
  incomeCents: number;
  expenseCents: number;
  benefitCents: number;
  balanceCents: number;
};

type UseSeriesDerivedOptions = {
  series: MonthlySeriesPoint[];
  yearValue: string;
  monthValue: string;
  yearTableSort: { key: YearTableSortKey; direction: SortDirection };
  allYearsTableSort: { key: AllTableSortKey; direction: SortDirection };
};

export function useSeriesDerived({
  series,
  yearValue,
  monthValue,
  yearTableSort,
  allYearsTableSort
}: UseSeriesDerivedOptions) {
  const yearSeries = useMemo(() => buildYearSeries(yearValue, series), [yearValue, series]);

  const allYears = useMemo<AllYearsPoint[]>(() => {
    const map = new Map<
      string,
      { income: number; expense: number; benefit: number; balance: number; latestMonth: string }
    >();
    for (const point of series) {
      const year = point.month.slice(0, 4);
      const entry =
        map.get(year) ?? { income: 0, expense: 0, benefit: 0, balance: 0, latestMonth: '' };
      entry.income += point.incomeCents;
      entry.expense += point.expenseCents;
      entry.benefit += point.benefitCents;
      if (point.month > entry.latestMonth) {
        entry.latestMonth = point.month;
        entry.balance = point.balanceCents;
      }
      map.set(year, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, data]) => ({
        year,
        incomeCents: data.income,
        expenseCents: data.expense,
        benefitCents: data.benefit,
        balanceCents: data.balance
      }));
  }, [series]);

  const yearTotals = useMemo<YearTotals>(() => {
    const totals = yearSeries.reduce(
      (acc, point) => {
        acc.income += point.incomeCents;
        acc.expense += point.expenseCents;
        acc.benefit += point.benefitCents;
        return acc;
      },
      { income: 0, expense: 0, benefit: 0 }
    );
    const lastBalance =
      [...yearSeries].reverse().find((point) => point.balanceCents !== 0)?.balanceCents ?? 0;
    return {
      incomeCents: totals.income,
      expenseCents: totals.expense,
      benefitCents: totals.benefit,
      balanceCents: lastBalance
    };
  }, [yearSeries]);

  const previousYearDecemberBalance = useMemo(() => {
    const previousYear = String(Number(yearValue) - 1);
    const previousMonth = `${previousYear}-12`;
    return series.find((point) => point.month === previousMonth)?.balanceCents ?? 0;
  }, [series, yearValue]);

  const yearTrendByMonth = useMemo(() => {
    const map = new Map<string, BalanceTrend>();
    yearSeries.forEach((point, index) => {
      const previousBalance =
        index > 0 ? yearSeries[index - 1].balanceCents : previousYearDecemberBalance;
      map.set(point.month, getBalanceTrend(point.balanceCents, previousBalance));
    });
    return map;
  }, [yearSeries, previousYearDecemberBalance]);

  const allYearsTrendByYear = useMemo(() => {
    const map = new Map<string, BalanceTrend>();
    allYears.forEach((point, index) => {
      const previousBalance = index > 0 ? allYears[index - 1].balanceCents : point.balanceCents;
      map.set(point.year, getBalanceTrend(point.balanceCents, previousBalance));
    });
    return map;
  }, [allYears]);

  const sortedYearSeries = useMemo(() => {
    const data = [...yearSeries];
    const { key, direction } = yearTableSort;
    data.sort((a, b) => {
      let compare = 0;
      if (key === 'month') {
        compare = a.month.localeCompare(b.month);
      } else if (key === 'income') {
        compare = a.incomeCents - b.incomeCents;
      } else if (key === 'expense') {
        compare = a.expenseCents - b.expenseCents;
      } else if (key === 'balance') {
        compare = a.balanceCents - b.balanceCents;
      } else {
        compare = a.benefitCents - b.benefitCents;
      }
      return direction === 'asc' ? compare : -compare;
    });
    return data;
  }, [yearSeries, yearTableSort]);

  const sortedAllYears = useMemo(() => {
    const data = [...allYears];
    const { key, direction } = allYearsTableSort;
    data.sort((a, b) => {
      let compare = 0;
      if (key === 'year') {
        compare = a.year.localeCompare(b.year);
      } else if (key === 'income') {
        compare = a.incomeCents - b.incomeCents;
      } else if (key === 'expense') {
        compare = a.expenseCents - b.expenseCents;
      } else if (key === 'balance') {
        compare = a.balanceCents - b.balanceCents;
      } else {
        compare = a.benefitCents - b.benefitCents;
      }
      return direction === 'asc' ? compare : -compare;
    });
    return data;
  }, [allYears, allYearsTableSort]);

  const availableYears = useMemo(() => {
    const years = new Set<string>(series.map((point) => point.month.slice(0, 4)));
    years.add(yearValue);
    years.add(monthValue.slice(0, 4));
    return Array.from(years).sort();
  }, [series, yearValue, monthValue]);

  const hasChartData = useMemo(
    () =>
      yearSeries.some(
        (point) =>
          point.incomeCents !== 0 ||
          point.expenseCents !== 0 ||
          point.balanceCents !== 0 ||
          point.benefitCents !== 0
      ),
    [yearSeries]
  );

  const hasAllYearsData = useMemo(
    () =>
      allYears.some(
        (point) =>
          point.incomeCents !== 0 ||
          point.expenseCents !== 0 ||
          point.balanceCents !== 0 ||
          point.benefitCents !== 0
      ),
    [allYears]
  );

  return {
    yearSeries,
    allYears,
    yearTotals,
    availableYears,
    yearTrendByMonth,
    allYearsTrendByYear,
    sortedYearSeries,
    sortedAllYears,
    hasChartData,
    hasAllYearsData
  };
}
