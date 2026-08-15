import { describe, expect, it } from 'vitest';
import { enrichInvestmentPerformance } from './investment';

const point = (
  month: string,
  portfolioCents: number,
  portfolioContributionCents?: number | null
) => ({
  month,
  balanceCents: 100_000,
  portfolioCents,
  portfolioContributionCents
});

describe('investment performance', () => {
  it('does not invent returns for legacy months', () => {
    const result = enrichInvestmentPerformance([
      point('2026-01', 10_000),
      point('2026-02', 20_000)
    ]);

    expect(result[0].portfolioInvestedCents).toBeNull();
    expect(result[0].portfolioResultCents).toBeNull();
    expect(result[1].portfolioInvestedCents).toBeNull();
    expect(result[1].portfolioResultCents).toBeNull();
  });

  it('uses the previous closing portfolio as the neutral baseline for the first explicit contribution', () => {
    const result = enrichInvestmentPerformance([
      point('2026-01', 20_000),
      point('2026-02', 30_245, 10_000)
    ]);

    expect(result[1].portfolioInvestedCents).toBe(30_000);
    expect(result[1].portfolioResultCents).toBe(245);
  });

  it('accumulates variable monthly contributions and derives the current result', () => {
    const result = enrichInvestmentPerformance([
      point('2026-01', 10_100, 10_000),
      point('2026-02', 19_850, 10_000),
      point('2026-03', 40_245, 20_000)
    ]);

    expect(result[0].portfolioInvestedCents).toBe(10_000);
    expect(result[0].portfolioResultCents).toBe(100);
    expect(result[1].portfolioInvestedCents).toBe(20_000);
    expect(result[1].portfolioResultCents).toBe(-150);
    expect(result[2].portfolioInvestedCents).toBe(40_000);
    expect(result[2].portfolioResultCents).toBe(245);
  });
});
