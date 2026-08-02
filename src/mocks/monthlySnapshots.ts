import { formatMonthValue } from '../utils/date';

export type MockMonthlySnapshot = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
};

const MOCK_START_YEAR = 2019;
const MOCK_START_MONTH_INDEX = 0;

export function buildMockMonthlySnapshots(): MockMonthlySnapshot[] {
  const now = new Date();
  const snapshots: MockMonthlySnapshot[] = [];
  let balanceCents = 780_000;
  let portfolioCents = 120_000;
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();
  const startMonthIndex = MOCK_START_YEAR * 12 + MOCK_START_MONTH_INDEX;
  const mockMonths = currentMonthIndex - startMonthIndex + 1;

  for (let offset = mockMonths - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const month = formatMonthValue(date.getFullYear(), date.getMonth() + 1);
    const incomeBase = 230_000 + (offset % 6) * 6_500;
    const expenseBase = 150_000 + (offset % 4) * 9_000;
    const incomeCents = Math.max(0, Math.round(incomeBase + Math.sin(offset / 2) * 12_000));
    const expenseCents =
      offset === 0
        ? incomeCents + 72_500
        : Math.max(0, Math.round(expenseBase + Math.cos(offset / 3) * 10_000));

    balanceCents += incomeCents - expenseCents;
    portfolioCents += 12_000 + Math.round(Math.sin(offset / 1.8) * 6_500);

    snapshots.push({
      month,
      incomeCents,
      expenseCents,
      balanceCents: Math.round(balanceCents),
      portfolioCents: Math.max(0, Math.round(portfolioCents))
    });
  }

  return snapshots;
}
