import { useCallback, useEffect, useState } from 'react';
import {
  claimDatabaseForCloudUser,
  DATABASE_PATH_CHANGED_EVENT,
  DatabaseOwnerMismatchError,
  getDatabaseAccessPolicy,
  releaseDatabaseToLocal,
  type DatabaseAccessPolicy
} from '../db';

export type DatabaseAccessError = 'owner-mismatch' | 'unavailable' | null;

export function useDatabaseAccess() {
  const [policy, setPolicy] = useState<DatabaseAccessPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DatabaseAccessError>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPolicy(await getDatabaseAccessPolicy());
    } catch {
      setPolicy(null);
      setError('unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const handleDatabasePathChange = () => {
      void reload();
    };
    window.addEventListener(DATABASE_PATH_CHANGED_EVENT, handleDatabasePathChange);
    return () => {
      window.removeEventListener(DATABASE_PATH_CHANGED_EVENT, handleDatabasePathChange);
    };
  }, [reload]);

  const claimForCloudUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const nextPolicy = await claimDatabaseForCloudUser(userId);
      setPolicy(nextPolicy);
      return true;
    } catch (nextError) {
      setError(nextError instanceof DatabaseOwnerMismatchError ? 'owner-mismatch' : 'unavailable');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const releaseToLocal = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const nextPolicy = await releaseDatabaseToLocal(userId);
      setPolicy(nextPolicy);
      return true;
    } catch (nextError) {
      setError(nextError instanceof DatabaseOwnerMismatchError ? 'owner-mismatch' : 'unavailable');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    policy,
    loading,
    error,
    claimForCloudUser,
    releaseToLocal,
    clearError,
    reload
  };
}
