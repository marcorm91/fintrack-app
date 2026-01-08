import { useCallback, useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { appDataDir, join } from '@tauri-apps/api/path';
import { DATABASE_FILENAME, getDatabasePath, setDatabasePath } from '../db';

type UseDatabasePathOptions = {
  onPathChange?: (path: string | null) => void;
};

function resolveInputPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const lower = trimmed.toLowerCase();
  if (lower.endsWith('.db')) {
    return trimmed;
  }
  const separator = trimmed.includes('\\') ? '\\' : '/';
  const base = trimmed.replace(/[\\/]+$/, '');
  return `${base}${separator}${DATABASE_FILENAME}`;
}

export function useDatabasePath({ onPathChange }: UseDatabasePathOptions = {}) {
  const [defaultPath, setDefaultPath] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [inputPath, setInputPath] = useState('');
  const [isDefaultPath, setIsDefaultPath] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const resolvePaths = async () => {
      let resolvedDefault = DATABASE_FILENAME;
      try {
        const baseDir = await appDataDir();
        resolvedDefault = await join(baseDir, DATABASE_FILENAME);
      } catch {
        resolvedDefault = DATABASE_FILENAME;
      }
      const storedPath = getDatabasePath();
      const nextPath = storedPath ?? resolvedDefault;
      if (!active) {
        return;
      }
      setDefaultPath(resolvedDefault);
      setCurrentPath(nextPath);
      setInputPath(nextPath);
      setIsDefaultPath(!storedPath);
      setLoading(false);
    };
    void resolvePaths();
    return () => {
      active = false;
    };
  }, []);

  const savePath = useCallback(() => {
    const nextPath = resolveInputPath(inputPath);
    if (!nextPath) {
      setError('settings.invalidDbPath');
      return false;
    }
    setDatabasePath(nextPath);
    setCurrentPath(nextPath);
    setIsDefaultPath(false);
    setError(null);
    onPathChange?.(nextPath);
    return true;
  }, [inputPath, onPathChange]);

  const browsePath = useCallback(async () => {
    setError(null);
    try {
      const selected = await open({ directory: true, multiple: false });
      if (!selected) {
        return;
      }
      const nextPath = Array.isArray(selected) ? selected[0] : selected;
      if (typeof nextPath === 'string') {
        setInputPath(nextPath);
      }
    } catch {
      setError('settings.dialogUnavailable');
    }
  }, []);

  const resetPath = useCallback(() => {
    setDatabasePath(null);
    const nextPath = defaultPath || DATABASE_FILENAME;
    setCurrentPath(nextPath);
    setInputPath(nextPath);
    setIsDefaultPath(true);
    setError(null);
    onPathChange?.(null);
  }, [defaultPath, onPathChange]);

  return {
    defaultPath,
    currentPath,
    inputPath,
    setInputPath,
    isDefaultPath,
    loading,
    error,
    setError,
    savePath,
    browsePath,
    resetPath
  };
}
