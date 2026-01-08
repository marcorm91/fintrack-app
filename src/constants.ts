import type { ChartType, TabKey } from './types';

export const BAR_TYPES = [
  { key: 'income', labelKey: 'series.income', colorClass: 'bg-income', fillClass: 'fill-income' },
  { key: 'expense', labelKey: 'series.expense', colorClass: 'bg-expense', fillClass: 'fill-expense' },
  { key: 'balance', labelKey: 'series.balance', colorClass: 'bg-balance', fillClass: 'fill-balance' },
  { key: 'benefit', labelKey: 'series.benefit', colorClass: 'bg-benefit', fillClass: 'fill-benefit' }
] as const;

export const CHART_TYPES: { key: ChartType; labelKey: string }[] = [
  { key: 'bar', labelKey: 'chartTypes.bar' },
  { key: 'line', labelKey: 'chartTypes.line' }
];

export const COLORS = {
  income: '#58a999',
  expense: '#c96d2d',
  balance: '#2f5fa8',
  benefit: '#1a7f37',
  benefitNegative: '#b42318',
  grid: 'rgba(31,41,55,0.15)',
  tick: '#5f6b7a'
};

export const X_TICK_FONT_SIZE = 12;

export const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'month', labelKey: 'tabs.month' },
  { key: 'year', labelKey: 'tabs.year' },
  { key: 'all', labelKey: 'tabs.all' }
];
