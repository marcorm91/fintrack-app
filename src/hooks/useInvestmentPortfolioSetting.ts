import { useCallback, useEffect, useState } from 'react';
import { getInvestmentPortfolioEnabled, setInvestmentPortfolioEnabled } from '../db';

type UseInvestmentPortfolioSettingOptions = {
  onError?: (message: string) => void;
};

export function useInvestmentPortfolioSetting({ onError }: UseInvestmentPortfolioSettingOptions = {}) {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getInvestmentPortfolioEnabled()
      .then((nextEnabled) => {
        if (!cancelled) {
          setEnabled(nextEnabled);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          onError?.(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onError]);

  const updateEnabled = useCallback(
    async (nextEnabled: boolean) => {
      const previousEnabled = enabled;
      setEnabled(nextEnabled);
      try {
        await setInvestmentPortfolioEnabled(nextEnabled);
      } catch (error) {
        setEnabled(previousEnabled);
        const message = error instanceof Error ? error.message : String(error);
        onError?.(message);
      }
    },
    [enabled, onError]
  );

  return {
    enabled,
    loading,
    setEnabled: updateEnabled
  };
}
