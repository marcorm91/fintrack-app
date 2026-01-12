import { useCallback, useEffect, useState } from 'react';
import type { ToastTone } from '../types';

export type ToastState = { message: string; tone: ToastTone } | null;

const DEFAULT_TIMEOUT_MS = 3600;

export function useToastAutoDismiss(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeoutId = window.setTimeout(() => setToast(null), timeoutMs);
    return () => window.clearTimeout(timeoutId);
  }, [toast, timeoutMs]);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, setToast, clearToast };
}
