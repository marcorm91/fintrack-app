import type { SeriesKey, TabKey } from './types';

export const FLOW_TYPES = [
  { key: 'income', labelKey: 'series.income', colorClass: 'bg-income', fillClass: 'fill-income' },
  { key: 'expense', labelKey: 'series.expense', colorClass: 'bg-expense', fillClass: 'fill-expense' },
  { key: 'benefit', labelKey: 'series.benefit', colorClass: 'bg-benefit', fillClass: 'fill-benefit' }
] as const;

export const WEALTH_TYPES = [
  { key: 'balance', labelKey: 'series.balance', colorClass: 'bg-balance', fillClass: 'fill-balance' },
  { key: 'portfolio', labelKey: 'series.portfolio', colorClass: 'bg-portfolio', fillClass: 'fill-portfolio' },
  {
    key: 'totalWealth',
    labelKey: 'series.totalWealth',
    colorClass: 'bg-totalWealth',
    fillClass: 'fill-totalWealth'
  }
] as const;

export const BAR_TYPES: Array<{
  key: SeriesKey;
  labelKey: string;
  colorClass: string;
  fillClass: string;
}> = [...FLOW_TYPES, ...WEALTH_TYPES];

export const COLORS = {
  income: '#70e3b6',
  expense: '#ff6b8f',
  balance: '#2878ff',
  portfolio: '#f4bc45',
  totalWealth: '#68778c',
  benefit: '#22b984',
  benefitNegative: '#f05268',
  grid: 'rgba(33,48,71,0.1)',
  tick: '#7a8798'
};

export const X_TICK_FONT_SIZE = 12;

export const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'month', labelKey: 'tabs.month' },
  { key: 'year', labelKey: 'tabs.year' },
  { key: 'all', labelKey: 'tabs.all' }
];
