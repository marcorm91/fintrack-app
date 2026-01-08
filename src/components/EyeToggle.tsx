import { useTranslation } from 'react-i18next';

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ) : (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function EyeToggle({
  hidden,
  onClick,
  label
}: {
  hidden: boolean;
  onClick: () => void;
  label: string;
}) {
  const { t } = useTranslation();
  const actionLabel = hidden ? t('actions.show', { label }) : t('actions.hide', { label });
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel}
      title={actionLabel}
      className="rounded-full border border-ink/10 bg-white p-1 text-muted shadow-sm transition hover:border-accent hover:text-ink"
    >
      <EyeIcon hidden={hidden} />
    </button>
  );
}

