import { SettingsIcon } from './icons';

type AppHeaderProps = {
  activeLanguage: 'en' | 'es';
  onLanguageChange: (language: 'en' | 'es') => void;
  onOpenSettings: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function AppHeader({
  activeLanguage,
  onLanguageChange,
  onOpenSettings,
  t
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.2em] text-accent2 sm:text-xs sm:tracking-[0.28em]">
            {t('app.tagline')}
          </p>
          <h1 className="truncate text-xl font-semibold text-ink sm:text-4xl">{t('app.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 p-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm sm:text-[10px]"
            role="group"
            aria-label={t('language.label')}
          >
            <button
              type="button"
              onClick={() => onLanguageChange('es')}
              aria-pressed={activeLanguage === 'es'}
              className={`rounded-full px-3 py-1 transition ${
                activeLanguage === 'es'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('language.es')}
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              aria-pressed={activeLanguage === 'en'}
              className={`rounded-full px-3 py-1 transition ${
                activeLanguage === 'en'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('language.en')}
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('actions.settings')}
            title={t('actions.settings')}
            className="rounded-full border border-ink/10 bg-white/80 p-2 text-muted shadow-sm transition hover:border-accent hover:text-ink"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

