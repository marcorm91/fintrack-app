import { LogoutIcon, SettingsIcon } from './icons';

type AppHeaderProps = {
  title: string;
  onOpenSettings: () => void;
  showSignOut: boolean;
  signOutLabel: string;
  onSignOut: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function AppHeader({
  title,
  onOpenSettings,
  showSignOut,
  signOutLabel,
  onSignOut,
  t
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="flex items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <img src="/app-icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-2xl shadow-sm sm:h-10 sm:w-10" />
          <span className="truncate text-xl font-semibold text-ink">{t('app.title')}</span>
        </div>
        <h1 className="hidden text-xl font-semibold lg:block">{title}</h1>
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {showSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              aria-label={signOutLabel}
              title={signOutLabel}
              className="btn btn-neutral btn-icon h-11 w-11 text-red-700 hover:text-red-800"
            >
              <LogoutIcon />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('actions.settings')}
            title={t('actions.settings')}
            className="btn btn-neutral btn-icon h-11 w-11 text-muted hover:text-ink"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
