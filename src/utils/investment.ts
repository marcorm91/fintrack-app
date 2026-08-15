export type InvestmentPerformanceInput = {
  month: string;
  balanceCents: number;
  portfolioCents: number;
  portfolioContributionCents?: number | null;
};

export type InvestmentPerformance = {
  portfolioInvestedCents: number | null;
  portfolioResultCents: number | null;
};

/**
 * Adds an accumulated contribution/result view without inventing historical returns.
 *
 * Legacy snapshots have a null contribution. When the first explicit contribution is
 * found, the latest previous portfolio value becomes the neutral starting capital.
 * From that point on, explicit monthly contributions are accumulated and the market
 * result is the difference against the actual closing portfolio value.
 */
export function enrichInvestmentPerformance<T extends InvestmentPerformanceInput>(points: T[]) {
  let started = false;
  let investedCents = 0;
  let previousPortfolioCents = 0;

  return points.map((point): T & InvestmentPerformance => {
    const contribution = point.portfolioContributionCents ?? null;

    if (!started && contribution !== null) {
      investedCents = previousPortfolioCents + contribution;
      started = true;
    } else if (started && contribution !== null) {
      investedCents += contribution;
    }

    const enriched = {
      ...point,
      portfolioInvestedCents: started ? investedCents : null,
      portfolioResultCents: started ? point.portfolioCents - investedCents : null
    };

    if (point.balanceCents !== 0 || point.portfolioCents !== 0) {
      previousPortfolioCents = point.portfolioCents;
    }

    return enriched;
  });
}
