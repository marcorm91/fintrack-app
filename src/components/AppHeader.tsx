import { SettingsIcon } from './icons';
import type { AppMode } from '../hooks/useAppMode';

type AppHeaderProps = {
  activeLanguage: 'en' | 'es';
  onLanguageChange: (language: 'en' | 'es') => void;
  onOpenSettings: () => void;
  appMode: AppMode;
  userEmail: string | null;
  offlineAccess: boolean;
  onSignOut: () => void;
  onChangeAppMode: (mode: AppMode) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function AppHeader({
  activeLanguage,
  onLanguageChange,
  onOpenSettings,
  appMode,
  userEmail,
  offlineAccess,
  onSignOut,
  onChangeAppMode,
  t
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 rounded-b-2xl border-b border-ink/5 bg-white/95 shadow-card backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/app-icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-2xl shadow-sm" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-ink sm:text-3xl">{t('app.title')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="segmented text-[9px] sm:text-[10px]"
            role="group"
            aria-label={t('language.label')}
          >
            <button
              type="button"
              onClick={() => onLanguageChange('es')}
              aria-pressed={activeLanguage === 'es'}
              className={`segmented-option px-3 py-1 text-[9px] sm:text-[10px] ${
                activeLanguage === 'es' ? 'segmented-option-active' : ''
              }`}
            >
              {t('language.es')}
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              aria-pressed={activeLanguage === 'en'}
              className={`segmented-option px-3 py-1 text-[9px] sm:text-[10px] ${
                activeLanguage === 'en' ? 'segmented-option-active' : ''
              }`}
            >
              {t('language.en')}
            </button>
          </div>
          {appMode === 'cloud' ? (
            <button
              type="button"
              onClick={onSignOut}
              title={
                offlineAccess
                  ? t('auth.offlineAccessActive')
                  : `${t('auth.signedInAs')} ${userEmail ?? ''}`.trim()
              }
              className="btn btn-neutral px-3 text-[9px] text-muted hover:text-ink sm:text-[10px]"
            >
              {t(offlineAccess ? 'auth.connectCloud' : 'auth.signOut')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChangeAppMode('cloud')}
              title={t('auth.enableCloud')}
              className="btn btn-neutral px-3 text-[9px] text-muted hover:text-ink sm:text-[10px]"
            >
              {t('auth.localBadge')}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('actions.settings')}
            title={t('actions.settings')}
            className="btn btn-neutral btn-icon text-muted hover:text-ink"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
