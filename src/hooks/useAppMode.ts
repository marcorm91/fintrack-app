import { useCallback, useState } from 'react';

export type AppMode = 'local' | 'cloud';

const APP_MODE_STORAGE_KEY = 'fintrack.appMode';

function loadAppMode(): AppMode | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(APP_MODE_STORAGE_KEY);
    return stored === 'local' || stored === 'cloud' ? stored : null;
  } catch {
    return null;
  }
}

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode | null>(loadAppMode);

  const setMode = useCallback((nextMode: AppMode) => {
    setModeState(nextMode);
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(APP_MODE_STORAGE_KEY, nextMode);
    } catch {
      // The in-memory choice still works when storage is unavailable.
    }
  }, []);

  return { mode, setMode };
}
