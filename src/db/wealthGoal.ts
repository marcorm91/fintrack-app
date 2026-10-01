import { compareAndSetAppSetting, getAppSetting, type SyncStatus } from './index';
import { isWealthGoal, type WealthGoal } from '../utils/wealthGoal';
import { notifyLocalDataChanged } from '../utils/localDataEvents';

const KEY = 'wealthGoal';
export const WEALTH_GOAL_CHANGED_EVENT = 'fintrack:wealth-goal-changed';
export type WealthGoalSetting = {
  goal: WealthGoal | null;
  version: number;
  localRevision: number;
  syncStatus: SyncStatus;
};
const EMPTY: WealthGoalSetting = { goal: null, version: 0, localRevision: 0, syncStatus: 'synced' };

export async function getWealthGoalSetting(): Promise<WealthGoalSetting> {
  const raw = await getAppSetting(KEY);
  if (raw === null) return { ...EMPTY };
  const value = JSON.parse(raw) as WealthGoalSetting;
  if ((value.goal !== null && !isWealthGoal(value.goal)) || !Number.isSafeInteger(value.version)
    || value.version < 0 || !Number.isSafeInteger(value.localRevision) || value.localRevision < 0
    || !['synced', 'pending', 'conflict'].includes(value.syncStatus)) throw new Error('Invalid wealth goal setting');
  return value;
}

export async function updateWealthGoalSetting(update: (current: WealthGoalSetting) => WealthGoalSetting) {
  // Retry only if another writer changed the same setting between read and write.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const raw = await getAppSetting(KEY);
    const current: WealthGoalSetting = raw === null ? { ...EMPTY } : JSON.parse(raw);
    const next = update(current);
    const serialized = JSON.stringify(next);
    if (raw === serialized) return next;
    if (await compareAndSetAppSetting(KEY, raw, serialized)) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(WEALTH_GOAL_CHANGED_EVENT));
      return next;
    }
  }
  throw new Error('Concurrent wealth goal update');
}

export async function setWealthGoal(goal: WealthGoal | null) {
  if (goal !== null && !isWealthGoal(goal)) throw new Error('Invalid wealth goal');
  await updateWealthGoalSetting((current) => ({
    goal: goal ? { targetAmountCents: goal.targetAmountCents, targetMonth: goal.targetMonth } : null,
    version: current.version, localRevision: current.localRevision + 1,
    syncStatus: current.syncStatus === 'conflict' ? 'conflict' : 'pending'
  }));
  notifyLocalDataChanged();
}
