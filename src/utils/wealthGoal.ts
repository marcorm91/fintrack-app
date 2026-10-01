export type WealthGoal = { targetAmountCents: number; targetMonth: string };

export function isWealthGoal(value: unknown): value is WealthGoal {
  if (!value || typeof value !== 'object') return false;
  const goal = value as WealthGoal;
  return Number.isSafeInteger(goal.targetAmountCents) && goal.targetAmountCents > 0
    && typeof goal.targetMonth === 'string' && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(goal.targetMonth);
}

export function getWealthGoalProgress(goal: WealthGoal, currentCents: number, asOfMonth: string) {
  const [year, month] = asOfMonth.split('-').map(Number);
  const [targetYear, targetMonth] = goal.targetMonth.split('-').map(Number);
  const monthsRemaining = Math.max(0, (targetYear - year) * 12 + targetMonth - month);
  const remainingCents = Math.max(0, goal.targetAmountCents - currentCents);
  const percent = currentCents / goal.targetAmountCents * 100;
  return {
    percent,
    visualPercent: Math.max(0, Math.min(100, percent)),
    remainingCents,
    monthsRemaining,
    monthlyCents: remainingCents === 0 ? 0 : monthsRemaining > 0 ? Math.round(remainingCents / monthsRemaining) : null,
    reached: remainingCents === 0
  };
}
