import { LogoutIcon, SettingsIcon } from './icons';

type AppHeaderProps = {
  onOpenSettings: () => void;
  showSignOut: boolean;
  signOutLabel: string;
  onSignOut: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function AppHeader({
  onOpenSettings,
  showSignOut,
  signOutLabel,
  onSignOut,
  t
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 rounded-b-2xl border-b border-ink/5 bg-white/95 shadow-card backdrop-blur">
      <div className="px-3 py-3 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-4 md:px-5">
        <div className="flex min-w-0 items-center gap-3 sm:flex-1">
          <img src="/app-icon.svg" alt="" className="h-10 w-10 shrink-0 rounded-2xl shadow-sm sm:h-9 sm:w-9" />
          <h1 className="truncate text-2xl font-semibold text-ink sm:text-3xl">{t('app.title')}</h1>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-ink/5 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
          {showSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              aria-label={signOutLabel}
              title={signOutLabel}
              className="btn btn-neutral btn-icon h-10 w-10 text-red-700 hover:text-red-800"
            >
              <LogoutIcon />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('actions.settings')}
            title={t('actions.settings')}
            className="btn btn-neutral btn-icon h-10 w-10 text-muted hover:text-ink"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
