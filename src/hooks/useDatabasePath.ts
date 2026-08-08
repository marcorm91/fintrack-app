import { useCallback, useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { appConfigDir, join } from '@tauri-apps/api/path';
import { DATABASE_FILENAME, getDatabasePath, isPortableMode, resolveDatabasePath, setDatabasePath } from '../db';
import { isMobilePlatform } from '../utils/platform';

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
  const canChangePath = !isMobilePlatform();
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
        const baseDir = await appConfigDir();
        resolvedDefault = await join(baseDir, DATABASE_FILENAME);
      } catch {
        resolvedDefault = DATABASE_FILENAME;
      }
      const resolvedPath = await resolveDatabasePath();
      const portableActive = isPortableMode();
      const storedPath = portableActive ? null : getDatabasePath();
      const nextPath = resolvedPath ?? resolvedDefault;
      if (!active) {
        return;
      }
      setDefaultPath(portableActive ? nextPath : resolvedDefault);
      setCurrentPath(nextPath);
      setInputPath(nextPath);
      setIsDefaultPath(!storedPath && !portableActive);
      setLoading(false);
    };
    void resolvePaths();
    return () => {
      active = false;
    };
  }, []);

  const savePath = useCallback(() => {
    if (!canChangePath) {
      return false;
    }
    const nextPath = resolveInputPath(inputPath);
    if (!nextPath) {
      setError('settings.invalidDbPath');
      return false;
    }
    setDatabasePath(nextPath);
    setCurrentPath(nextPath);
    setInputPath(nextPath);
    setIsDefaultPath(false);
    setError(null);
    onPathChange?.(nextPath);
    return true;
  }, [canChangePath, inputPath, onPathChange]);

  const browsePath = useCallback(async () => {
    if (!canChangePath) {
      return;
    }
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
  }, [canChangePath]);

  const resetPath = useCallback(() => {
    if (!canChangePath) {
      return;
    }
    const nextPath = defaultPath || DATABASE_FILENAME;
    if (isPortableMode()) {
      setDatabasePath(nextPath, { persist: false, portable: true });
      setCurrentPath(nextPath);
      setInputPath(nextPath);
      setIsDefaultPath(true);
      setError(null);
      onPathChange?.(nextPath);
      return;
    }
    setDatabasePath(null);
    setCurrentPath(nextPath);
    setInputPath(nextPath);
    setIsDefaultPath(true);
    setError(null);
    onPathChange?.(null);
  }, [canChangePath, defaultPath, onPathChange]);

  return {
    defaultPath,
    currentPath,
    inputPath,
    setInputPath,
    isDefaultPath,
    loading,
    error,
    canChangePath,
    setError,
    savePath,
    browsePath,
    resetPath
  };
}
