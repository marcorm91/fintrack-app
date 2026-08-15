import { useMemo } from 'react';
import type {
  AllTableSortKey,
  SeriesKey,
  SeriesTrendMap,
  SortDirection,
  YearTableSortKey
} from '../types';
import type { MonthlySeriesPoint } from '../db';
import { buildYearSeries, getBalanceTrend, hasClosingBalanceEntry } from '../utils/series';

export type AllYearsPoint = {
  year: string;
  incomeCents: number;
  expenseCents: number;
  benefitCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  investmentResultCents?: number | null;
};

export type YearTotals = {
  incomeCents: number;
  expenseCents: number;
  benefitCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  investmentResultCents?: number | null;
};

const SERIES_VALUE_GETTERS: Record<SeriesKey, (point: MonthlySeriesPoint | AllYearsPoint) => number> = {
  income: (point) => point.incomeCents,
  expense: (point) => point.expenseCents,
  benefit: (point) => point.benefitCents,
  balance: (point) => point.balanceCents,
  portfolio: (point) => point.portfolioCents,
  totalWealth: (point) => point.totalWealthCents
};

const buildTrendMap = (
  current: MonthlySeriesPoint | AllYearsPoint,
  previous: MonthlySeriesPoint | AllYearsPoint
): SeriesTrendMap => ({
  income: getBalanceTrend(SERIES_VALUE_GETTERS.income(current), SERIES_VALUE_GETTERS.income(previous)),
  expense: getBalanceTrend(SERIES_VALUE_GETTERS.expense(current), SERIES_VALUE_GETTERS.expense(previous)),
  benefit: getBalanceTrend(SERIES_VALUE_GETTERS.benefit(current), SERIES_VALUE_GETTERS.benefit(previous)),
  balance: getBalanceTrend(SERIES_VALUE_GETTERS.balance(current), SERIES_VALUE_GETTERS.balance(previous)),
  portfolio: getBalanceTrend(SERIES_VALUE_GETTERS.portfolio(current), SERIES_VALUE_GETTERS.portfolio(previous)),
  totalWealth: getBalanceTrend(SERIES_VALUE_GETTERS.totalWealth(current), SERIES_VALUE_GETTERS.totalWealth(previous))
});

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
      {
        income: number;
        expense: number;
        benefit: number;
        balance: number;
        portfolio: number;
        totalWealth: number;
        investmentResult: number;
        hasInvestmentResult: boolean;
        latestClosingBalanceMonth: string;
      }
    >();
    let previousPortfolioResultCents: number | null = null;
    for (const point of [...series].sort((a, b) => a.month.localeCompare(b.month))) {
      const year = point.month.slice(0, 4);
      const entry =
        map.get(year) ?? {
          income: 0,
          expense: 0,
          benefit: 0,
          balance: 0,
          portfolio: 0,
          totalWealth: 0,
          investmentResult: 0,
          hasInvestmentResult: false,
          latestClosingBalanceMonth: ''
        };
      entry.income += point.incomeCents;
      entry.expense += point.expenseCents;
      entry.benefit += point.benefitCents;
      if (point.portfolioResultCents != null) {
        entry.investmentResult += point.portfolioResultCents - (previousPortfolioResultCents ?? 0);
        entry.hasInvestmentResult = true;
        previousPortfolioResultCents = point.portfolioResultCents;
      }
      if (hasClosingBalanceEntry(point) && point.month > entry.latestClosingBalanceMonth) {
        entry.latestClosingBalanceMonth = point.month;
        entry.balance = point.balanceCents;
        entry.portfolio = point.portfolioCents;
        entry.totalWealth = point.totalWealthCents;
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
        balanceCents: data.balance,
        portfolioCents: data.portfolio,
        totalWealthCents: data.totalWealth,
        investmentResultCents: data.hasInvestmentResult ? data.investmentResult : null
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
    const lastWealthSnapshot =
      [...yearSeries]
        .reverse()
        .find((point) => hasClosingBalanceEntry(point)) ?? null;
    return {
      incomeCents: totals.income,
      expenseCents: totals.expense,
      benefitCents: totals.benefit,
      balanceCents: lastWealthSnapshot?.balanceCents ?? 0,
      portfolioCents: lastWealthSnapshot?.portfolioCents ?? 0,
      totalWealthCents: lastWealthSnapshot?.totalWealthCents ?? 0,
      investmentResultCents: allYears.find((point) => point.year === yearValue)?.investmentResultCents ?? null
    };
  }, [allYears, yearSeries, yearValue]);

  const realPointByMonth = useMemo(
    () => new Map(series.map((point) => [point.month, point])),
    [series]
  );

  const yearTrendByMonth = useMemo(() => {
    const map = new Map<string, SeriesTrendMap>();
    yearSeries.forEach((point, index) => {
      const currentPoint = realPointByMonth.get(point.month);
      const previousMonth = index > 0 ? yearSeries[index - 1].month : `${Number(yearValue) - 1}-12`;
      const previousPoint = realPointByMonth.get(previousMonth);
      if (!currentPoint || !previousPoint) {
        return;
      }
      map.set(point.month, buildTrendMap(currentPoint, previousPoint));
    });
    return map;
  }, [realPointByMonth, yearSeries, yearValue]);

  const allYearsTrendByYear = useMemo(() => {
    const map = new Map<string, SeriesTrendMap>();
    allYears.forEach((point, index) => {
      if (index === 0) {
        return;
      }
      const previousPoint = allYears[index - 1];
      map.set(point.year, buildTrendMap(point, previousPoint));
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
      } else if (key === 'portfolio') {
        compare = a.portfolioCents - b.portfolioCents;
      } else if (key === 'totalWealth') {
        compare = a.totalWealthCents - b.totalWealthCents;
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
      } else if (key === 'portfolio') {
        compare = a.portfolioCents - b.portfolioCents;
      } else if (key === 'totalWealth') {
        compare = a.totalWealthCents - b.totalWealthCents;
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
          point.portfolioCents !== 0 ||
          point.totalWealthCents !== 0 ||
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
          point.portfolioCents !== 0 ||
          point.totalWealthCents !== 0 ||
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
