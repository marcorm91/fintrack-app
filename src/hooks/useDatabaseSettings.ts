import { useCallback, useState } from 'react';
import { useDatabasePath } from './useDatabasePath';

type UseDatabaseSettingsOptions = {
  onPathChange: () => void;
};

export function useDatabaseSettings({ onPathChange }: UseDatabaseSettingsOptions) {
  const {
    currentPath,
    defaultPath,
    inputPath,
    setInputPath,
    isDefaultPath,
    loading,
    error,
    setError,
    savePath,
    browsePath,
    resetPath
  } = useDatabasePath({ onPathChange });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = useCallback(() => {
    setError(null);
    setSettingsOpen(true);
  }, [setError]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const saveSettings = useCallback(() => {
    const saved = savePath();
    if (saved) {
      setSettingsOpen(false);
    }
  }, [savePath]);

  const resetSettings = useCallback(() => {
    resetPath();
    setSettingsOpen(false);
  }, [resetPath]);

  const handleDatabasePathInputChange = useCallback(
    (value: string) => {
      setError(null);
      setInputPath(value);
    },
    [setError, setInputPath]
  );

  return {
    settingsOpen,
    openSettings,
    closeSettings,
    saveSettings,
    resetSettings,
    handleDatabasePathInputChange,
    currentPath,
    defaultPath,
    inputPath,
    isDefaultPath,
    loading,
    error,
    browsePath
  };
}
