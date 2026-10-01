import type { ChangeEvent, ReactNode, RefObject } from 'react';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

type AppLayoutProps = {
  onOpenSettings: () => void;
  showSignOut: boolean;
  signOutLabel: string;
  onSignOut: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  importInputRef: RefObject<HTMLInputElement>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  title: string;
  navigation: ReactNode;
  children: ReactNode;
  dialogs?: ReactNode;
  toast?: ReactNode;
};

export function AppLayout({
  onOpenSettings,
  showSignOut,
  signOutLabel,
  onSignOut,
  t,
  importInputRef,
  onFileChange,
  title,
  navigation,
  children,
  dialogs,
  toast
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      {navigation}
      <div className="app-workspace">
        <AppHeader
          title={title}
          onOpenSettings={onOpenSettings}
          showSignOut={showSignOut}
          signOutLabel={signOutLabel}
          onSignOut={onSignOut}
          t={t}
        />
        <input ref={importInputRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />
        <main id="main-content" className="app-content">
          <h1 className="sr-only lg:hidden">{title}</h1>
          {children}
          <AppFooter />
        </main>
        {dialogs}
        {toast}
      </div>
    </div>
  );
}
