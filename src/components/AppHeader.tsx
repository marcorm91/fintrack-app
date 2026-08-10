import { SettingsIcon } from './icons';
import type { AppMode } from '../hooks/useAppMode';

type AppHeaderProps = {
  activeLanguage: 'en' | 'es';
  onLanguageChange: (language: 'en' | 'es') => void;
  onOpenSettings: () => void;
  appMode: AppMode;
  userEmail: string | null;
  offlineAccess: boolean;
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
  onChangeAppMode,
  t
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 rounded-b-2xl border-b border-ink/5 bg-white/95 shadow-card backdrop-blur">
      <div className="px-3 py-3 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-4 md:px-5">
        <div className="flex min-w-0 items-center justify-between gap-3 sm:flex-1 sm:justify-start">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/app-icon.svg" alt="" className="h-10 w-10 shrink-0 rounded-2xl shadow-sm sm:h-9 sm:w-9" />
            <h1 className="truncate text-2xl font-semibold text-ink sm:text-3xl">{t('app.title')}</h1>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('actions.settings')}
            title={t('actions.settings')}
            className="btn btn-neutral btn-icon h-10 w-10 text-muted hover:text-ink sm:hidden"
          >
            <SettingsIcon />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-ink/5 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
          <div
            className="segmented shrink-0 text-[9px] sm:text-[10px]"
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
          {appMode !== 'cloud' ? (
            <button
              type="button"
              onClick={() => onChangeAppMode('cloud')}
              title={t('auth.enableCloud')}
              className="btn btn-neutral min-w-0 flex-1 whitespace-nowrap px-3 text-[9px] text-muted hover:text-ink sm:flex-none sm:text-[10px]"
            >
              {t('auth.localBadge')}
            </button>
          ) : userEmail || offlineAccess ? (
            <span
              title={
                offlineAccess
                  ? t('auth.offlineAccessActive')
                  : `${t('auth.signedInAs')} ${userEmail ?? ''}`.trim()
              }
              className="hidden max-w-[180px] truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted md:block"
            >
              {offlineAccess ? t('auth.offlineAccessActive') : userEmail}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('actions.settings')}
            title={t('actions.settings')}
            className="btn btn-neutral btn-icon hidden text-muted hover:text-ink sm:inline-flex"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
