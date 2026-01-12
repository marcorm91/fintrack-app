import { useCallback, useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';

export type UpdateStatus = 'idle' | 'checking' | 'upToDate' | 'updateAvailable' | 'error';

const DEFAULT_REPO = 'marcorm91/fintrack-app';

type UseUpdateStatusOptions = {
  repo?: string;
};

type ReleaseResponse = {
  tag_name?: string;
  name?: string;
  html_url?: string;
};

const normalizeVersion = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const match = value.match(/\d+\.\d+\.\d+/);
  if (match) {
    return match[0];
  }
  return value.replace(/^v/i, '');
};

const compareVersions = (left: string | null, right: string | null) => {
  if (!left || !right) {
    return 0;
  }
  const leftParts = left.split('.').map((part) => {
    const value = Number.parseInt(part, 10);
    return Number.isNaN(value) ? 0 : value;
  });
  const rightParts = right.split('.').map((part) => {
    const value = Number.parseInt(part, 10);
    return Number.isNaN(value) ? 0 : value;
  });
  const max = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < max; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) {
      return 1;
    }
    if (leftValue < rightValue) {
      return -1;
    }
  }
  return 0;
};

export function useUpdateStatus({ repo = DEFAULT_REPO }: UseUpdateStatusOptions = {}) {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [latestReleaseUrl, setLatestReleaseUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    getVersion()
      .then((version) => {
        if (mounted) {
          setCurrentVersion(normalizeVersion(version));
        }
      })
      .catch(() => {
        // Ignore, version stays null until next check.
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!isOnline) {
      setStatus('error');
      return;
    }

    setStatus('checking');
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!response.ok) {
        throw new Error(`Update check failed with ${response.status}`);
      }
      const data = (await response.json()) as ReleaseResponse;
      const latest = normalizeVersion(data.tag_name ?? data.name);
      if (!latest) {
        throw new Error('Missing latest version');
      }
      setLatestVersion(latest);
      setLatestReleaseUrl(data.html_url ?? null);

      let resolvedCurrent = currentVersion;
      if (!resolvedCurrent) {
        resolvedCurrent = normalizeVersion(await getVersion());
        if (!resolvedCurrent) {
          throw new Error('Missing current version');
        }
        setCurrentVersion(resolvedCurrent);
      }

      const comparison = compareVersions(latest, resolvedCurrent);
      setStatus(comparison === 1 ? 'updateAvailable' : 'upToDate');
    } catch {
      setStatus('error');
    } finally {
      setLastChecked(new Date());
    }
  }, [currentVersion, isOnline, repo]);

  return {
    status,
    currentVersion,
    latestVersion,
    latestReleaseUrl,
    isOnline,
    lastChecked,
    checkForUpdates
  };
}
