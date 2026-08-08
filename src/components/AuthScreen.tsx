import { FirebaseError } from 'firebase/app';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeToggle } from './EyeToggle';

type AuthScreenProps = {
  initializationError: unknown;
  onSignIn: (email: string, password: string) => Promise<void>;
  onRequestPasswordReset: (email: string) => Promise<void>;
  onUseLocal: () => void;
};

function authErrorKey(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'auth.errors.generic';
  }
  switch (error.code) {
    case 'auth/invalid-email':
      return 'auth.errors.invalidEmail';
    case 'auth/invalid-credential':
    case 'auth/user-disabled':
      return 'auth.errors.invalidCredentials';
    case 'auth/network-request-failed':
      return 'auth.errors.network';
    case 'auth/too-many-requests':
      return 'auth.errors.tooManyAttempts';
    default:
      return 'auth.errors.generic';
  }
}

export function AuthScreen({
  initializationError,
  onSignIn,
  onRequestPasswordReset,
  onUseLocal
}: AuthScreenProps) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(
    initializationError ? t(authErrorKey(initializationError)) : null
  );
  const [status, setStatus] = useState<string | null>(null);
  const activeLanguage = i18n.language.startsWith('en') ? 'en' : 'es';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setSubmitting(true);
    try {
      await onSignIn(email, password);
    } catch (nextError) {
      setError(t(authErrorKey(nextError)));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setStatus(null);
    if (!email.trim()) {
      setError(t('auth.errors.emailRequired'));
      return;
    }
    setResetting(true);
    try {
      await onRequestPasswordReset(email);
      setStatus(t('auth.resetSent'));
    } catch (nextError) {
      setError(t(authErrorKey(nextError)));
    } finally {
      setResetting(false);
    }
  };

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

      <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center justify-center py-12">
        <section className="w-full rounded-3xl border border-ink/10 bg-white/95 p-6 shadow-card backdrop-blur sm:p-8">
          <div className="mb-7 text-center">
            <img
              src="/app-icon.svg"
              alt=""
              className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-sm sm:h-20 sm:w-20"
            />
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{t('app.title')}</h1>
            <p className="mt-2 text-sm text-muted">{t('auth.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t('auth.email')}
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={submitting}
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
                placeholder={t('auth.emailPlaceholder')}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t('auth.password')}
              </span>
              <span className="flex items-center gap-2">
                <input
                  type={passwordHidden ? 'password' : 'text'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                  className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
                />
                <EyeToggle
                  hidden={passwordHidden}
                  onClick={() => setPasswordHidden((hidden) => !hidden)}
                  label={t('auth.password')}
                />
              </span>
            </label>

            <div className="min-h-5 text-sm" aria-live="polite">
              {error ? <p className="text-red-700">{error}</p> : null}
              {status ? <p className="text-benefit">{status}</p> : null}
            </div>

            <button type="submit" disabled={submitting || resetting} className="btn btn-primary w-full py-3">
              {submitting ? t('auth.signingIn') : t('auth.signIn')}
            </button>
            <p className="text-center text-[11px] leading-5 text-muted">
              {t('auth.sessionRemembered')}
            </p>
            <button
              type="button"
              onClick={() => void handlePasswordReset()}
              disabled={submitting || resetting}
              className="w-full text-center text-xs font-semibold text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
            >
              {resetting ? t('auth.sendingReset') : t('auth.forgotPassword')}
            </button>
          </form>

          <p className="mt-7 border-t border-ink/10 pt-5 text-center text-xs leading-5 text-muted">
            {t('auth.privateAccess')}
          </p>
          <button
            type="button"
            onClick={onUseLocal}
            className="btn btn-neutral mt-4 w-full py-3 text-xs"
          >
            {t('auth.continueLocal')}
          </button>
          <p className="mt-2 text-center text-[11px] leading-5 text-muted">
            {t('auth.continueLocalDescription')}
          </p>
        </section>
      </main>
    </div>
  );
}
