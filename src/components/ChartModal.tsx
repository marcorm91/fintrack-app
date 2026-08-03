import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type ChartModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  closeLabel?: string;
  fullScreen?: boolean;
  requestLandscape?: boolean;
  rotateHint?: string;
  children: ReactNode;
};

export function ChartModal({
  open,
  title,
  onClose,
  closeLabel = 'Close',
  fullScreen = false,
  requestLandscape = false,
  rotateHint,
  children
}: ChartModalProps) {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !fullScreen) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const media = window.matchMedia('(orientation: portrait)');
    const update = () => setIsPortrait(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, [open, fullScreen]);

  useEffect(() => {
    if (!open || !fullScreen || !requestLandscape) {
      return;
    }
    if (typeof screen === 'undefined') {
      return;
    }
    const lockOrientation = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: 'landscape') => Promise<void>;
        };
        if (orientation.lock) {
          await orientation.lock('landscape');
        }
      } catch {
        // Ignore orientation lock failures.
      }
    };
    void lockOrientation();
    return () => {
      try {
        screen.orientation?.unlock?.();
      } catch {
        // Ignore unlock failures.
      }
    };
  }, [open, fullScreen, requestLandscape]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-ink/50 ${
        fullScreen ? 'items-stretch justify-stretch px-0 py-0' : 'items-center justify-center px-4 py-6'
      }`}
    >
      <div
        className={`flex flex-col border border-ink/10 bg-white shadow-card ${
          fullScreen ? 'h-full w-full rounded-none' : 'w-full max-w-3xl rounded-2xl'
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="btn btn-neutral btn-icon text-muted hover:text-ink"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {fullScreen && rotateHint && isPortrait ? (
          <div className="border-b border-ink/10 bg-ink/5 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
            {rotateHint}
          </div>
        ) : null}
        <div className={`px-4 py-4 ${fullScreen ? 'flex-1 min-h-0' : ''}`}>
          <div className={fullScreen ? 'h-full' : 'h-[60vh]'}>{children}</div>
        </div>
      </div>
    </div>
  );
}
