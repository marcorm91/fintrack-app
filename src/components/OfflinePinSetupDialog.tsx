import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeToggle } from './EyeToggle';

export function OfflinePinSetupDialog({
  open,
  onSave,
  onCancel
}: {
  open: boolean;
  onSave: (pin: string) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [hidden, setHidden] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPin('');
      setConfirmation('');
      setHidden(true);
      setSaving(false);
      setError(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const normalizePin = (value: string) => value.replace(/\D/g, '').slice(0, 6);

  const handleSave = async () => {
    setError(null);
    if (!/^\d{6}$/.test(pin)) {
      setError(t('settings.offlinePinInvalidFormat'));
      return;
    }
    if (pin !== confirmation) {
      setError(t('settings.offlinePinMismatch'));
      return;
    }
    setSaving(true);
    try {
      await onSave(pin);
    } catch {
      setError(t('settings.offlinePinSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-4">
      <section className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-5 shadow-card sm:p-6">
        <h4 className="text-lg font-semibold text-ink">{t('settings.offlinePinDialogTitle')}</h4>
        <p className="mt-2 text-xs leading-5 text-muted">
          {t('settings.offlinePinDialogDescription')}
        </p>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-ink">
              {t('settings.offlinePinNew')}
            </span>
            <div className="flex items-center gap-2">
              <input
                type={hidden ? 'password' : 'text'}
                value={pin}
                onChange={(event) => setPin(normalizePin(event.target.value))}
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                disabled={saving}
                className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-4 py-3 text-center text-sm tracking-[0.4em] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
              />
              <EyeToggle
                hidden={hidden}
                onClick={() => setHidden((current) => !current)}
                label={t('settings.offlinePinTitle')}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-ink">
              {t('settings.offlinePinConfirm')}
            </span>
            <input
              type={hidden ? 'password' : 'text'}
              value={confirmation}
              onChange={(event) => setConfirmation(normalizePin(event.target.value))}
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              disabled={saving}
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-center text-sm tracking-[0.4em] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
            />
          </label>
        </div>
        {error ? (
          <p className="mt-3 text-xs leading-5 text-red-700" aria-live="polite">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="btn btn-neutral text-xs"
          >
            {t('actions.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="btn btn-primary text-xs"
          >
            {saving ? t('settings.offlinePinSaving') : t('settings.offlinePinSave')}
          </button>
        </div>
      </section>
    </div>
  );
}
