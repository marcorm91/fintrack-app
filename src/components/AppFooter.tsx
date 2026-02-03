import { useTranslation } from 'react-i18next';
import pkg from '../../package.json';

export function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mt-6 flex items-center justify-center text-[10px] uppercase tracking-[0.18em] text-muted sm:mt-10 sm:text-xs sm:tracking-[0.2em]">
      <span>
        {t('footer.openSource')} · {t('footer.version', { version: pkg.version })}
      </span>
    </footer>
  );
}
