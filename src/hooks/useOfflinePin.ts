import { useCallback, useEffect, useState } from 'react';
import { DATABASE_PATH_CHANGED_EVENT } from '../db';
import {
  configureOfflinePin,
  disableOfflinePin,
  hasOfflinePin,
  verifyOfflinePin,
  type OfflinePinVerification
} from '../services/offlinePin';

export function useOfflinePin() {
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setConfigured(await hasOfflinePin());
    } catch {
      setConfigured(false);
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

  const configure = useCallback(async (pin: string) => {
    await configureOfflinePin(pin);
    setConfigured(true);
  }, []);

  const disable = useCallback(async () => {
    await disableOfflinePin();
    setConfigured(false);
  }, []);

  const verify = useCallback((pin: string): Promise<OfflinePinVerification> => {
    return verifyOfflinePin(pin);
  }, []);

  return { configured, loading, configure, disable, verify };
}
