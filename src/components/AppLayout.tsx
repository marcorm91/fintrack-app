import type { ChangeEvent, ReactNode, RefObject } from 'react';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

type AppLayoutProps = {
  activeLanguage: 'en' | 'es';
  onLanguageChange: (languageValue: 'en' | 'es') => void;
  onOpenSettings: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  importInputRef: RefObject<HTMLInputElement>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  tabs: ReactNode;
  children: ReactNode;
  dialogs?: ReactNode;
  toast?: ReactNode;
};

export function AppLayout({
  activeLanguage,
  onLanguageChange,
  onOpenSettings,
  t,
  importInputRef,
  onFileChange,
  tabs,
  children,
  dialogs,
  toast
}: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(247,231,211,0.9),rgba(247,231,211,0)_60%),radial-gradient(circle_at_top_right,rgba(215,238,244,0.9),rgba(215,238,244,0)_55%),linear-gradient(120deg,#f5f2ec_0%,#eef4f6_100%)] relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-6 h-20 w-28 -rotate-6 text-accent/25"
      >
        <svg viewBox="0 0 140 90" className="h-full w-full" role="img">
          <rect x="6" y="10" width="128" height="70" rx="12" className="fill-current" opacity="0.18" />
          <rect
            x="16"
            y="20"
            width="108"
            height="50"
            rx="10"
            className="fill-none stroke-current"
            strokeWidth="3"
            opacity="0.5"
          />
          <circle cx="70" cy="45" r="16" className="fill-none stroke-current" strokeWidth="3" opacity="0.65" />
          <path
            d="M30 45h16M94 45h16"
            className="fill-none stroke-current"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      </div>
      <div className="w-full px-3 py-4 pb-[calc(6rem+var(--app-safe-bottom))] sm:px-4 sm:py-10 sm:pb-10 md:px-6 relative z-10 min-h-screen flex flex-col">
        <AppHeader
          activeLanguage={activeLanguage}
          onLanguageChange={onLanguageChange}
          onOpenSettings={onOpenSettings}
          t={t}
        />
        <input ref={importInputRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />
        {tabs}
        <main className="mt-3 gap-4 sm:mt-6 sm:gap-6 flex flex-col flex-1">{children}</main>
        <AppFooter />
        {dialogs}
        {toast}
      </div>
    </div>
  );
}
