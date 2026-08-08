import { useTranslation } from 'react-i18next';

type AccessModeScreenProps = {
  onChooseCloud: () => void;
  onChooseLocal: () => void;
};

export function AccessModeScreen({ onChooseCloud, onChooseLocal }: AccessModeScreenProps) {
  const { t, i18n } = useTranslation();
  const activeLanguage = i18n.language.startsWith('en') ? 'en' : 'es';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f9fffb_0%,#f4fbf8_52%,#fff7fa_100%)] px-4 py-6 sm:px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <div className="segmented" role="group" aria-label={t('language.label')}>
          {(['es', 'en'] as const).map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => void i18n.changeLanguage(language)}
              aria-pressed={activeLanguage === language}
              className={`segmented-option px-3 py-1 text-[9px] sm:text-[10px] ${
                activeLanguage === language ? 'segmented-option-active' : ''
              }`}
            >
              {t(`language.${language}`)}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl items-center justify-center py-12">
        <section className="w-full rounded-3xl border border-ink/10 bg-white/95 p-6 shadow-card backdrop-blur sm:p-8">
          <div className="mb-7 text-center">
            <img
              src="/app-icon.svg"
              alt=""
              className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-sm sm:h-20 sm:w-20"
            />
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{t('auth.modeTitle')}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{t('auth.modeDescription')}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onChooseCloud}
              className="rounded-2xl border border-ink bg-ink p-5 text-left text-white transition hover:bg-ink/95"
            >
              <span className="block text-sm font-semibold">{t('auth.chooseCloud')}</span>
              <span className="mt-2 block text-xs leading-5 text-white/75">
                {t('auth.chooseCloudDescription')}
              </span>
            </button>
            <button
              type="button"
              onClick={onChooseLocal}
              className="rounded-2xl border border-ink/15 bg-white p-5 text-left text-ink transition hover:border-ink/30 hover:bg-ink/[0.02]"
            >
              <span className="block text-sm font-semibold">{t('auth.chooseLocal')}</span>
              <span className="mt-2 block text-xs leading-5 text-muted">
                {t('auth.chooseLocalDescription')}
              </span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-muted">{t('auth.modeChangeLater')}</p>
        </section>
      </main>
    </div>
  );
}
