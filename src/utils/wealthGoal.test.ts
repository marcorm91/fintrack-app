import { describe, expect, it } from 'vitest';
import { getWealthGoalProgress, isWealthGoal } from './wealthGoal';
import { applyInvestmentPortfolioSetting } from './series';
import { buildJsonBackup, parseJsonBackup } from './backup';

const goal = { targetAmountCents: 600000, targetMonth: '2027-06' };
const point = { month: '2026-09', incomeCents: 0, expenseCents: 0, balanceCents: 369750,
  portfolioCents: 21234, totalWealthCents: 390984, benefitCents: 0, note: '' };

describe('wealth goal calculations', () => {
  it('calculates the reference example using the displayed closing month', () => {
    const result = getWealthGoalProgress(goal, 390984, '2026-09');
    expect(result.percent).toBeCloseTo(65.164);
    expect(result.remainingCents).toBe(209016);
    expect(result.monthsRemaining).toBe(9);
    expect(result.monthlyCents).toBe(23224);
  });
  it.each([600000, 700000])('caps the bar and reports success at %i cents', (current) => {
    const result = getWealthGoalProgress(goal, current, '2026-09');
    expect(result.reached).toBe(true);
    expect(result.visualPercent).toBe(100);
    expect(result.remainingCents).toBe(0);
    expect(result.monthlyCents).toBe(0);
    expect(result.percent).toBeGreaterThanOrEqual(100);
  });
  it.each(['2027-06', '2027-07'])('does not divide by zero once due (%s)', (month) => {
    expect(getWealthGoalProgress(goal, 390984, month)).toMatchObject({ monthsRemaining: 0, monthlyCents: null, remainingCents: 209016 });
  });
  it('keeps a negative balance visible in the remaining amount without a negative bar', () => {
    expect(getWealthGoalProgress(goal, -10000, '2026-09')).toMatchObject({ visualPercent: 0, remainingCents: 610000 });
  });
  it.each([true, false])('follows the same portfolio setting as the header: %s', (enabled) => {
    const effective = applyInvestmentPortfolioSetting(point, enabled);
    expect(getWealthGoalProgress(goal, effective.totalWealthCents, point.month).remainingCents).toBe(enabled ? 209016 : 230250);
  });
  it('does not change progress when cash is transferred into an enabled portfolio', () => {
    const moved = { ...point, balanceCents: point.balanceCents - 10000, portfolioCents: point.portfolioCents + 10000 };
    expect(applyInvestmentPortfolioSetting(moved, true).totalWealthCents).toBe(point.totalWealthCents);
  });
  it.each([null, {}, { ...goal, targetAmountCents: 0 }, { ...goal, targetAmountCents: -1 },
    { ...goal, targetAmountCents: 1.5 }, { ...goal, targetAmountCents: Infinity },
    { ...goal, targetAmountCents: Number.MAX_SAFE_INTEGER + 1 }, { ...goal, targetMonth: '2027-13' },
    { ...goal, targetMonth: 'x' }])('rejects invalid goal data %j', (value) => {
    expect(isWealthGoal(value)).toBe(false);
  });
});

describe('wealth goal backup compatibility', () => {
  it('reads old backups without inventing a goal', () => {
    const backup = JSON.parse(buildJsonBackup([point], true, '3.3.5'));
    delete backup.settings.wealthGoal;
    expect(parseJsonBackup(JSON.stringify(backup)).wealthGoal).toBeNull();
  });
  it('round-trips a goal in settings with unchanged format version', () => {
    const text = buildJsonBackup([point], false, '3.4.0', goal);
    expect(JSON.parse(text).formatVersion).toBe(1);
    expect(parseJsonBackup(text)).toMatchObject({ wealthGoal: goal, investmentPortfolioEnabled: false });
    expect(JSON.parse(text).snapshots[0].wealthGoal).toBeUndefined();
  });
  it('preserves deletion and historical target dates', () => {
    expect(parseJsonBackup(buildJsonBackup([], true, '3.4.0', null)).wealthGoal).toBeNull();
    expect(parseJsonBackup(buildJsonBackup([], true, '3.4.0', { ...goal, targetMonth: '2020-01' })).wealthGoal?.targetMonth).toBe('2020-01');
  });
  it('rejects malformed goals on import', () => {
    const backup = JSON.parse(buildJsonBackup([], true, '3.4.0', goal));
    backup.settings.wealthGoal.targetAmountCents = -5;
    expect(() => parseJsonBackup(JSON.stringify(backup))).toThrow();
  });
});
