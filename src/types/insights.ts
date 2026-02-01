import type { SeriesKey } from './types';

export type InsightDelta = {
  key: SeriesKey;
  label: string;
  deltaCents: number;
  percentChange: number | null;
  currentCents: number;
  previousCents: number;
};

export type InsightComparison = {
  key: string;
  label: string;
  deltas: InsightDelta[];
  hasData: boolean;
};

export type InsightsPayload = {
  title: string;
  emptyLabel: string;
  currentLabel: string;
  previousLabel: string;
  comparisons: InsightComparison[];
  hasAnyData: boolean;
};
