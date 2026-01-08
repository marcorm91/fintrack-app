export type FormState = {
  income: string;
  expense: string;
  balance: string;
};

export type TabKey = 'month' | 'year' | 'all';
export type BalanceTrend = 'up' | 'down' | 'flat';
export type SeriesKey = 'income' | 'expense' | 'balance' | 'benefit';
export type ImportScope = 'month' | 'year' | 'all';
export type ChartType = 'bar' | 'line';
export type ToastTone = 'danger';
export type SortDirection = 'asc' | 'desc';
export type YearTableSortKey = 'month' | 'income' | 'expense' | 'balance' | 'benefit';
export type AllTableSortKey = 'year' | 'income' | 'expense' | 'balance' | 'benefit';
