import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  remote: null as Record<string, unknown> | null,
  afterTransaction: null as (() => Promise<void>) | null
}));
vi.mock('../db/index', () => ({
  getAppSetting: async (key: string) => mocks.settings.get(key) ?? null,
  compareAndSetAppSetting: async (key: string, expected: string | null, value: string) => {
    if ((mocks.settings.get(key) ?? null) !== expected) return false;
    mocks.settings.set(key, value);
    return true;
  }
}));
vi.mock('./firebaseFirestore', () => ({ getFirebaseFirestore: () => ({}) }));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}), serverTimestamp: () => 'server-time', onSnapshot: vi.fn(),
  runTransaction: async (_db: unknown, callback: (transaction: unknown) => Promise<unknown>) => {
    const result = await callback({
      get: async () => ({ exists: () => mocks.remote !== null, data: () => mocks.remote }),
      set: (_ref: unknown, value: Record<string, unknown>) => { mocks.remote = value; }
    });
    const after = mocks.afterTransaction;
    mocks.afterTransaction = null;
    await after?.();
    return result;
  }
}));
import { getWealthGoalSetting, setWealthGoal } from '../db/wealthGoal';
import { resolveWealthGoalConflict, synchronizeWealthGoal } from './wealthGoalSync';
const goal = { targetAmountCents: 600000, targetMonth: '2027-06' };
const other = { targetAmountCents: 800000, targetMonth: '2027-12' };
beforeEach(() => { mocks.settings.clear(); mocks.remote = null; mocks.afterTransaction = null; });

describe('goal persistence and cloud sync', () => {
  it('starts empty, saves locally and retains a deletion for offline sync', async () => {
    expect((await getWealthGoalSetting()).goal).toBeNull();
    await setWealthGoal(goal);
    expect(await getWealthGoalSetting()).toMatchObject({ goal, syncStatus: 'pending' });
    await setWealthGoal(null);
    expect(await getWealthGoalSetting()).toMatchObject({ goal: null, syncStatus: 'pending', localRevision: 2 });
  });
  it('rejects invalid saves without touching stored settings', async () => {
    await expect(setWealthGoal({ ...goal, targetAmountCents: 0 })).rejects.toThrow();
    expect(mocks.settings.size).toBe(0);
  });
  it('pushes an offline goal and then its deletion', async () => {
    await setWealthGoal(goal);
    await synchronizeWealthGoal('user');
    expect(mocks.remote).toMatchObject({ goal, version: 1 });
    expect((await getWealthGoalSetting()).syncStatus).toBe('synced');
    await setWealthGoal(null);
    await synchronizeWealthGoal('user');
    expect(mocks.remote).toMatchObject({ goal: null, version: 2 });
  });
  it('pulls a goal and a remote deletion', async () => {
    mocks.remote = { schemaVersion: 1, goal, version: 1 };
    await synchronizeWealthGoal('user');
    expect((await getWealthGoalSetting()).goal).toEqual(goal);
    mocks.remote = { schemaVersion: 1, goal: null, version: 2 };
    await synchronizeWealthGoal('user');
    expect((await getWealthGoalSetting()).goal).toBeNull();
  });
  it.each(['local', 'cloud'] as const)('uses existing explicit conflict resolution: %s', async (resolution) => {
    await setWealthGoal(goal);
    mocks.remote = { schemaVersion: 1, goal: other, version: 1 };
    await synchronizeWealthGoal('user');
    expect((await getWealthGoalSetting()).syncStatus).toBe('conflict');
    await resolveWealthGoalConflict('user', resolution);
    await synchronizeWealthGoal('user');
    expect((await getWealthGoalSetting()).goal).toEqual(resolution === 'local' ? goal : other);
    expect(mocks.remote?.goal).toEqual(resolution === 'local' ? goal : other);
  });
  it('retains edits made while an earlier revision uploads', async () => {
    await setWealthGoal(goal);
    mocks.afterTransaction = () => setWealthGoal(other);
    await synchronizeWealthGoal('user');
    expect(await getWealthGoalSetting()).toMatchObject({ goal: other, syncStatus: 'pending', version: 1 });
    await synchronizeWealthGoal('user');
    expect(mocks.remote).toMatchObject({ goal: other, version: 2 });
  });
  it('does not overwrite an edit made during a pull', async () => {
    mocks.remote = { schemaVersion: 1, goal, version: 1 };
    mocks.afterTransaction = () => setWealthGoal(other);
    await synchronizeWealthGoal('user');
    expect((await getWealthGoalSetting()).goal).toEqual(other);
    await synchronizeWealthGoal('user');
    expect((await getWealthGoalSetting()).syncStatus).toBe('conflict');
  });
  it('acknowledges a committed upload after a lost response', async () => {
    await setWealthGoal(goal);
    mocks.remote = { schemaVersion: 1, goal, version: 1 };
    await synchronizeWealthGoal('user');
    expect(await getWealthGoalSetting()).toMatchObject({ goal, version: 1, syncStatus: 'synced' });
  });
  it('does not silently accept malformed remote data', async () => {
    mocks.remote = { schemaVersion: 1, goal: {}, version: 1 };
    await expect(synchronizeWealthGoal('user')).rejects.toThrow();
    expect((await getWealthGoalSetting()).goal).toBeNull();
  });
});
