import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getConflictedMonthlySnapshots,
  getPendingMonthlySnapshots,
  isUsingMockDatabase
} from '../db';
import type { CloudConflictResolution } from '../services/cloudSync';
import { LOCAL_DATA_CHANGED_EVENT } from '../utils/localDataEvents';

let cloudSyncModulePromise: Promise<typeof import('../services/cloudSync')> | null = null;

function loadCloudSyncModule() {
  if (!cloudSyncModulePromise) {
    cloudSyncModulePromise = import('../services/cloudSync');
  }
  return cloudSyncModulePromise;
}

async function getLocalCloudSyncCounts() {
  const [pending, conflicts] = await Promise.all([
    getPendingMonthlySnapshots(),
    getConflictedMonthlySnapshots()
  ]);
  return { pendingCount: pending.length, conflictCount: conflicts.length };
}

function isCloudNetworkError(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return (
    typeof code === 'string' &&
    ['deadline-exceeded', 'network-request-failed', 'unavailable'].includes(code)
  );
}

export type CloudSyncPhase =
  | 'disabled'
  | 'idle'
  | 'pending'
  | 'syncing'
  | 'offline'
  | 'conflict'
  | 'error';

export type CloudSyncStatus = {
  phase: CloudSyncPhase;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
};

type UseCloudSyncOptions = {
  enabled: boolean;
  userId: string | null;
  onRemoteChange: () => Promise<void>;
};

const DISABLED_STATUS: CloudSyncStatus = {
  phase: 'disabled',
  pendingCount: 0,
  conflictCount: 0,
  lastSyncedAt: null
};

export function useCloudSync({ enabled, userId, onRemoteChange }: UseCloudSyncOptions) {
  const active = enabled && Boolean(userId) && !isUsingMockDatabase();
  const [status, setStatus] = useState<CloudSyncStatus>(DISABLED_STATUS);
  const mountedRef = useRef(true);
  const runningRef = useRef<Promise<void> | null>(null);
  const resolvingRef = useRef<Promise<boolean> | null>(null);
  const rerunRequestedRef = useRef(false);
  const onRemoteChangeRef = useRef(onRemoteChange);

  useEffect(() => {
    onRemoteChangeRef.current = onRemoteChange;
  }, [onRemoteChange]);

  const syncNow = useCallback(async () => {
    if (!active || !userId) {
      return;
    }
    if (resolvingRef.current) {
      rerunRequestedRef.current = true;
      await resolvingRef.current;
      return;
    }
    if (runningRef.current) {
      rerunRequestedRef.current = true;
      return runningRef.current;
    }

    const run = (async () => {
      do {
        rerunRequestedRef.current = false;
        if (mountedRef.current) {
          setStatus((current) => ({ ...current, phase: 'syncing' }));
        }
        try {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const counts = await getLocalCloudSyncCounts();
            if (mountedRef.current) {
              setStatus((current) => ({ ...current, ...counts, phase: 'offline' }));
            }
            break;
          }

          const cloudSync = await loadCloudSyncModule();
          const result = await cloudSync.synchronizeCloudData(userId);
          if (result.pulledCount > 0) {
            await onRemoteChangeRef.current();
          }
          if (mountedRef.current) {
            setStatus({
              phase:
                result.conflictCount > 0
                  ? 'conflict'
                  : result.pendingCount > 0
                    ? 'pending'
                    : 'idle',
              pendingCount: result.pendingCount,
              conflictCount: result.conflictCount,
              lastSyncedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          const counts = await getLocalCloudSyncCounts();
          if (mountedRef.current) {
            setStatus((current) => ({
              ...current,
              ...counts,
              phase: isCloudNetworkError(error) ? 'offline' : 'error'
            }));
          }
          break;
        }
      } while (rerunRequestedRef.current && active);
    })();

    runningRef.current = run;
    try {
      await run;
    } finally {
      if (runningRef.current === run) {
        runningRef.current = null;
      }
      if (rerunRequestedRef.current && active && mountedRef.current) {
        rerunRequestedRef.current = false;
        void syncNow();
      }
    }
  }, [active, userId]);

  const resolveConflicts = useCallback(
    async (resolution: CloudConflictResolution) => {
      if (!active || !userId) {
        return;
      }
      if (resolvingRef.current) {
        await resolvingRef.current;
        return;
      }
      if (runningRef.current) {
        await runningRef.current;
      }

      const run = (async () => {
        if (mountedRef.current) {
          setStatus((current) => ({ ...current, phase: 'syncing' }));
        }
        try {
          const cloudSync = await loadCloudSyncModule();
          await cloudSync.resolveCloudConflicts(userId, resolution);
          await onRemoteChangeRef.current();
          return true;
        } catch (error) {
          const counts = await getLocalCloudSyncCounts();
          if (mountedRef.current) {
            setStatus((current) => ({
              ...current,
              ...counts,
              phase: isCloudNetworkError(error) ? 'offline' : 'error'
            }));
          }
          return false;
        }
      })();

      resolvingRef.current = run;
      let resolved = false;
      try {
        resolved = await run;
      } finally {
        if (resolvingRef.current === run) {
          resolvingRef.current = null;
        }
      }
      if (resolved) {
        await syncNow();
      }
    },
    [active, syncNow, userId]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!active || !userId) {
      setStatus(DISABLED_STATUS);
      return () => {
        mountedRef.current = false;
      };
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleSync = (delay = 350) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void syncNow();
      }, delay);
    };
    const handleOnline = () => scheduleSync(0);
    const handleLocalChange = () => scheduleSync();
    let cancelled = false;
    let unsubscribe = () => {};
    void loadCloudSyncModule()
      .then((cloudSync) => {
        if (cancelled) {
          return;
        }
        unsubscribe = cloudSync.subscribeToCloudChanges(
          userId,
          () => scheduleSync(750),
          (error) => {
            if (mountedRef.current) {
              setStatus((current) => ({
                ...current,
                phase: isCloudNetworkError(error) ? 'offline' : 'error'
              }));
            }
          }
        );
        scheduleSync(0);
      })
      .catch((error) => {
        if (mountedRef.current) {
          setStatus((current) => ({
            ...current,
            phase: isCloudNetworkError(error) ? 'offline' : 'error'
          }));
        }
      });

    window.addEventListener('online', handleOnline);
    window.addEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalChange);

    return () => {
      mountedRef.current = false;
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalChange);
    };
  }, [active, syncNow, userId]);

  return { status, syncNow, resolveConflicts };
}
