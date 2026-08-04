type BenefitPoint = {
  benefitCents: number;
};

export function findBenefitExtremes<Point extends BenefitPoint>(points: Point[]) {
  if (points.length === 0) {
    return { best: null, worst: null };
  }

  let best = points[0];
  let worst = points[0];
  for (const point of points) {
    if (point.benefitCents > best.benefitCents) {
      best = point;
    }
    if (point.benefitCents < worst.benefitCents) {
      worst = point;
    }
  }
  return { best, worst };
}
