import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getWealthGoalSetting, updateWealthGoalSetting } from '../db/wealthGoal';
import { isWealthGoal, type WealthGoal } from '../utils/wealthGoal';
import { getFirebaseFirestore } from './firebaseFirestore';

type RemoteGoal = { goal: WealthGoal | null; version: number };
function reference(userId: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'settings', 'wealthGoal');
}
function parseRemote(value: Record<string, unknown>): RemoteGoal {
  if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.version) || (value.version as number) < 1
    || (value.goal !== null && !isWealthGoal(value.goal))) throw new Error('Invalid cloud wealth goal');
  return { goal: value.goal as WealthGoal | null, version: value.version as number };
}
function equal(left: WealthGoal | null, right: WealthGoal | null) {
  return left === right || (left !== null && right !== null
    && left.targetAmountCents === right.targetAmountCents && left.targetMonth === right.targetMonth);
}

export async function synchronizeWealthGoal(userId: string) {
  const local = await getWealthGoalSetting();
  const result = await runTransaction(getFirebaseFirestore(), async (transaction) => {
    const ref = reference(userId);
    const snapshot = await transaction.get(ref);
    const remote = snapshot.exists() ? parseRemote(snapshot.data()) : null;
    if (local.syncStatus !== 'pending') return { remote, conflict: false, pushed: false };
    if ((remote?.version ?? 0) !== local.version) {
      return { remote, conflict: !remote || !equal(local.goal, remote.goal), pushed: false };
    }
    const next = { goal: local.goal, version: local.version + 1 };
    transaction.set(ref, { ...next, schemaVersion: 1, updatedAt: serverTimestamp() });
    return { remote: next, conflict: false, pushed: true };
  });
  if (result.conflict) {
    await updateWealthGoalSetting((current) => current.version === local.version
      ? { ...current, syncStatus: 'conflict' } : current);
    return { pulledCount: 0, pushedCount: 0 };
  }
  const remote = result.remote;
  if (!remote || local.syncStatus === 'conflict') return { pulledCount: 0, pushedCount: 0 };
  let pulled = false;
  await updateWealthGoalSetting((current) => {
    if (current.version !== local.version || current.syncStatus === 'conflict') return current;
    if (current.localRevision !== local.localRevision) {
      // An edit made during upload retains its data and is sent against the acknowledged version.
      if (local.syncStatus === 'pending' && (result.pushed || equal(local.goal, remote.goal))) {
        return { ...current, version: remote.version };
      }
      return current;
    }
    if (remote.version <= current.version && current.syncStatus === 'synced') return current;
    pulled = !equal(current.goal, remote.goal);
    return { ...current, goal: remote.goal, version: remote.version, syncStatus: 'synced' };
  });
  return { pulledCount: pulled ? 1 : 0, pushedCount: result.pushed ? 1 : 0 };
}

export async function resolveWealthGoalConflict(userId: string, resolution: 'local' | 'cloud') {
  const local = await getWealthGoalSetting();
  if (local.syncStatus !== 'conflict') return;
  const remote = await runTransaction(getFirebaseFirestore(), async (transaction) => {
    const snapshot = await transaction.get(reference(userId));
    return snapshot.exists() ? parseRemote(snapshot.data()) : null;
  });
  await updateWealthGoalSetting((current) => {
    if (current.version !== local.version || current.localRevision !== local.localRevision) return current;
    return resolution === 'local'
      ? { ...current, version: remote?.version ?? 0, syncStatus: 'pending' }
      : { ...current, goal: remote?.goal ?? null, version: remote?.version ?? 0, syncStatus: 'synced' };
  });
}

export function subscribeToWealthGoal(userId: string, onChange: () => void, onError: (error: Error) => void) {
  return onSnapshot(reference(userId), onChange, onError);
}
