import { useTranslation } from 'react-i18next';

export function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mt-10 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-muted">
      <span>
        {t('footer.openSource')}
      </span>
    </footer>
  );
}
