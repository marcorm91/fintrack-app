import type { TabKey } from './types';

export const FLOW_TYPES = [
  { key: 'income', labelKey: 'series.income' },
  { key: 'expense', labelKey: 'series.expense' },
  { key: 'benefit', labelKey: 'series.benefit' }
] as const;

export const WEALTH_TYPES = [
  { key: 'balance', labelKey: 'series.balance' },
  { key: 'portfolio', labelKey: 'series.portfolio' },
  { key: 'totalWealth', labelKey: 'series.totalWealth' }
] as const;

export const COLORS = {
  income: '#70e3b6',
  expense: '#ff6b8f',
  balance: '#2878ff',
  portfolio: '#f4bc45',
  portfolioGain: '#8adbb8',
  portfolioLoss: '#f59baa',
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
