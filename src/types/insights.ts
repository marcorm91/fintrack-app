import type { SeriesKey } from './types';

export type InsightDelta = {
  key: SeriesKey;
  label: string;
  deltaCents: number;
  percentChange: number | null;
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
  comparisons: InsightComparison[];
  hasAnyData: boolean;
};
