import type { ChangeEvent, ReactNode, RefObject } from 'react';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import type { AppMode } from '../hooks/useAppMode';

type AppLayoutProps = {
  activeLanguage: 'en' | 'es';
  onLanguageChange: (languageValue: 'en' | 'es') => void;
  onOpenSettings: () => void;
  appMode: AppMode;
  userEmail: string | null;
  offlineAccess: boolean;
  onChangeAppMode: (mode: AppMode) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  importInputRef: RefObject<HTMLInputElement>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  overview?: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
  dialogs?: ReactNode;
  toast?: ReactNode;
};

export function AppLayout({
  activeLanguage,
  onLanguageChange,
  onOpenSettings,
  appMode,
  userEmail,
  offlineAccess,
  onChangeAppMode,
  t,
  importInputRef,
  onFileChange,
  overview,
  tabs,
  children,
  dialogs,
  toast
}: AppLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[linear-gradient(180deg,#f9fffb_0%,#f4fbf8_46%,#fff7fa_100%)]">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 pb-[calc(6rem+var(--app-safe-bottom))] sm:px-5 sm:py-6 sm:pb-8 md:px-8">
        <AppHeader
          activeLanguage={activeLanguage}
          onLanguageChange={onLanguageChange}
          onOpenSettings={onOpenSettings}
          appMode={appMode}
          userEmail={userEmail}
          offlineAccess={offlineAccess}
          onChangeAppMode={onChangeAppMode}
          t={t}
        />
        <input ref={importInputRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />
        {overview}
        {tabs}
        <main className="mt-3 gap-4 sm:mt-6 sm:gap-6 flex flex-col flex-1">{children}</main>
        <AppFooter />
        {dialogs}
        {toast}
      </div>
    </div>
  );
}
