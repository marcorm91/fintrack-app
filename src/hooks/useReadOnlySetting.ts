import { useCallback, useState } from 'react';

const READ_ONLY_STORAGE_KEY = 'fintrack.readOnly';

export function useReadOnlySetting() {
  const [readOnly, setReadOnly] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(READ_ONLY_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleReadOnly = useCallback((value: boolean) => {
    setReadOnly(value);
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(READ_ONLY_STORAGE_KEY, value ? 'true' : 'false');
    } catch {
      // Ignore storage failures (private mode, disabled storage).
    }
  }, []);

  return { readOnly, toggleReadOnly };
}
