import {
  Timestamp,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import {
  acknowledgeMonthlySnapshotSync,
  applyRemoteMonthlySnapshot,
  forceApplyRemoteMonthlySnapshot,
  getConflictedMonthlySnapshots,
  getPendingMonthlySnapshots,
  isUsingMockDatabase,
  markMonthlySnapshotConflict,
  rebaseConflictedMonthlySnapshot,
  type RemoteMonthlySnapshot,
  type SyncableMonthlySnapshot
} from '../db';
import { getFirebaseFirestore } from './firebaseFirestore';

const REMOTE_SCHEMA_VERSION = 1;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_NOTE_LENGTH = 500;
const MAX_UPLOAD_ROUNDS = 5;

export type CloudConflictResolution = 'local' | 'cloud';

export type CloudSyncResult = {
  pulledCount: number;
  pushedCount: number;
  pendingCount: number;
  conflictCount: number;
};

export class CloudSyncConflictError extends Error {
  constructor(readonly month: string) {
    super(`Conflicto de sincronización en ${month}.`);
    this.name = 'CloudSyncConflictError';
  }
}

export class CloudDataValidationError extends Error {
  constructor(readonly month: string) {
    super(`Los datos cloud de ${month} no tienen un formato válido.`);
    this.name = 'CloudDataValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function parseTimestamp(value: unknown, month: string): string {
  if (!(value instanceof Timestamp)) {
    throw new CloudDataValidationError(month);
  }
  return value.toDate().toISOString();
}

function parseNullableTimestamp(value: unknown, month: string): string | null {
  return value === null ? null : parseTimestamp(value, month);
}

function parseRemoteMonthlySnapshot(
  snapshot: DocumentSnapshot<DocumentData, DocumentData>
): RemoteMonthlySnapshot {
  const value = snapshot.data();
  const month = snapshot.id;
  if (
    !snapshot.exists() ||
    !MONTH_PATTERN.test(month) ||
    !isRecord(value) ||
    value.schemaVersion !== REMOTE_SCHEMA_VERSION ||
    value.month !== month ||
    !isSafeInteger(value.incomeCents) ||
    value.incomeCents < 0 ||
    !isSafeInteger(value.expenseCents) ||
    value.expenseCents < 0 ||
    !isSafeInteger(value.balanceCents) ||
    !isSafeInteger(value.portfolioCents) ||
    value.portfolioCents < 0 ||
    !(
      value.portfolioContributionCents === undefined ||
      value.portfolioContributionCents === null ||
      (isSafeInteger(value.portfolioContributionCents) && value.portfolioContributionCents >= 0)
    ) ||
    typeof value.note !== 'string' ||
    value.note.length > MAX_NOTE_LENGTH ||
    !isSafeInteger(value.version) ||
    value.version < 1
  ) {
    throw new CloudDataValidationError(month);
  }

  return {
    month,
    incomeCents: value.incomeCents,
    expenseCents: value.expenseCents,
    balanceCents: value.balanceCents,
    portfolioCents: value.portfolioCents,
    portfolioContributionCents: value.portfolioContributionCents ?? null,
    note: value.note,
    version: value.version,
    updatedAt: parseTimestamp(value.updatedAt, month),
    deletedAt: parseNullableTimestamp(value.deletedAt, month)
  };
}

function snapshotsHaveSameContent(
  local: SyncableMonthlySnapshot,
  remote: RemoteMonthlySnapshot
) {
  return (
    local.month === remote.month &&
    local.incomeCents === remote.incomeCents &&
    local.expenseCents === remote.expenseCents &&
    local.balanceCents === remote.balanceCents &&
    local.portfolioCents === remote.portfolioCents &&
    local.portfolioContributionCents === remote.portfolioContributionCents &&
    local.note === remote.note &&
    Boolean(local.deletedAt) === Boolean(remote.deletedAt)
  );
}

function monthlySnapshotsCollection(userId: string) {
  return collection(getFirebaseFirestore(), 'users', userId, 'monthlySnapshots');
}

async function getRemoteMonthlySnapshots(userId: string) {
  const snapshot = await getDocsFromServer(monthlySnapshotsCollection(userId));
  return snapshot.docs
    .map((document) => parseRemoteMonthlySnapshot(document))
    .sort((left, right) => left.month.localeCompare(right.month));
}

async function pushMonthlySnapshot(
  userId: string,
  local: SyncableMonthlySnapshot
): Promise<RemoteMonthlySnapshot> {
  const firestore = getFirebaseFirestore();
  const reference = doc(monthlySnapshotsCollection(userId), local.month);
  const existingRemote = await runTransaction(firestore, async (transaction) => {
    const remoteDocument = await transaction.get(reference);
    const remote = remoteDocument.exists() ? parseRemoteMonthlySnapshot(remoteDocument) : null;
    const remoteVersion = remote?.version ?? 0;

    if (remoteVersion !== local.version) {
      if (remote && remote.version > local.version && snapshotsHaveSameContent(local, remote)) {
        return remote;
      }
      throw new CloudSyncConflictError(local.month);
    }

    transaction.set(reference, {
      schemaVersion: REMOTE_SCHEMA_VERSION,
      month: local.month,
      incomeCents: local.incomeCents,
      expenseCents: local.expenseCents,
      balanceCents: local.balanceCents,
      portfolioCents: local.portfolioCents,
      portfolioContributionCents: local.portfolioContributionCents,
      note: local.note,
      version: remoteVersion + 1,
      updatedAt: serverTimestamp(),
      deletedAt: local.deletedAt ? serverTimestamp() : null
    });
    return null;
  });

  if (existingRemote) {
    return existingRemote;
  }
  const committedDocument = await getDocFromServer(reference);
  return parseRemoteMonthlySnapshot(committedDocument);
}

async function applyRemoteSnapshots(remoteSnapshots: RemoteMonthlySnapshot[]) {
  const pendingByMonth = new Map(
    (await getPendingMonthlySnapshots()).map((snapshot) => [snapshot.month, snapshot])
  );
  let pulledCount = 0;

  for (const remote of remoteSnapshots) {
    const pending = pendingByMonth.get(remote.month);
    if (
      pending &&
      remote.version > pending.version &&
      snapshotsHaveSameContent(pending, remote)
    ) {
      const acknowledgement = await acknowledgeMonthlySnapshotSync({
        month: pending.month,
        expectedVersion: pending.version,
        expectedLocalRevision: pending.localRevision,
        nextVersion: remote.version,
        remoteUpdatedAt: remote.updatedAt,
        remoteDeletedAt: remote.deletedAt
      });
      if (acknowledgement !== 'stale') {
        continue;
      }
    }

    const result = await applyRemoteMonthlySnapshot(remote);
    if (result === 'applied') {
      pulledCount += 1;
    }
  }
  return pulledCount;
}

async function pushPendingSnapshots(userId: string) {
  let pushedCount = 0;

  for (let round = 0; round < MAX_UPLOAD_ROUNDS; round += 1) {
    const pending = await getPendingMonthlySnapshots();
    if (!pending.length) {
      break;
    }
    let supersededUpload = false;

    for (const local of pending) {
      try {
        const remote = await pushMonthlySnapshot(userId, local);
        const acknowledgement = await acknowledgeMonthlySnapshotSync({
          month: local.month,
          expectedVersion: local.version,
          expectedLocalRevision: local.localRevision,
          nextVersion: remote.version,
          remoteUpdatedAt: remote.updatedAt,
          remoteDeletedAt: remote.deletedAt
        });
        if (acknowledgement === 'synced') {
          pushedCount += 1;
        }
        if (acknowledgement === 'superseded') {
          supersededUpload = true;
        }
      } catch (error) {
        if (!(error instanceof CloudSyncConflictError)) {
          throw error;
        }
        await markMonthlySnapshotConflict(local.month, local.version, local.localRevision);
      }
    }

    if (!supersededUpload) {
      break;
    }
  }
  return pushedCount;
}

export async function synchronizeCloudData(userId: string): Promise<CloudSyncResult> {
  if (isUsingMockDatabase()) {
    return { pulledCount: 0, pushedCount: 0, pendingCount: 0, conflictCount: 0 };
  }

  const remoteSnapshots = await getRemoteMonthlySnapshots(userId);
  const pulledCount = await applyRemoteSnapshots(remoteSnapshots);
  const pushedCount = await pushPendingSnapshots(userId);
  const [pending, conflicts] = await Promise.all([
    getPendingMonthlySnapshots(),
    getConflictedMonthlySnapshots()
  ]);
  return {
    pulledCount,
    pushedCount,
    pendingCount: pending.length,
    conflictCount: conflicts.length
  };
}

export async function resolveCloudConflicts(
  userId: string,
  resolution: CloudConflictResolution
) {
  const [remoteSnapshots, conflicts] = await Promise.all([
    getRemoteMonthlySnapshots(userId),
    getConflictedMonthlySnapshots()
  ]);
  const remoteByMonth = new Map(remoteSnapshots.map((snapshot) => [snapshot.month, snapshot]));

  for (const conflict of conflicts) {
    const remote = remoteByMonth.get(conflict.month);
    if (!remote) {
      throw new CloudDataValidationError(conflict.month);
    }
    if (resolution === 'local') {
      await rebaseConflictedMonthlySnapshot(conflict.month, remote.version);
    } else {
      await forceApplyRemoteMonthlySnapshot(remote);
    }
  }
}

export function subscribeToCloudChanges(
  userId: string,
  onChange: () => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(monthlySnapshotsCollection(userId), onChange, onError);
}
