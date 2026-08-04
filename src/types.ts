export type FormState = {
  income: string;
  expense: string;
  balance: string;
  portfolio: string;
  note: string;
};

export type TabKey = 'month' | 'year' | 'all';
export type BalanceTrend = 'up' | 'down' | 'flat';
export type SeriesKey =
  | 'income'
  | 'expense'
  | 'benefit'
  | 'balance'
  | 'portfolio'
  | 'totalWealth';
export type SeriesTrendMap = Record<SeriesKey, BalanceTrend>;
export type ImportScope = 'month' | 'year' | 'all';
export type ToastTone = 'danger';
export type SortDirection = 'asc' | 'desc';
export type YearTableSortKey =
  | 'month'
  | 'income'
  | 'expense'
  | 'benefit'
  | 'balance'
  | 'portfolio'
  | 'totalWealth';
export type AllTableSortKey =
  | 'year'
  | 'income'
  | 'expense'
  | 'benefit'
  | 'balance'
  | 'portfolio'
  | 'totalWealth';
