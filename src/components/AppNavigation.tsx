import type { TabKey } from '../types';
import { TABS } from '../constants';

function NavigationIcon({ tab }: { tab: TabKey }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {tab === 'summary' ? <><path d="m3 10 9-7 9 7M5 9v12h14V9" /></> : tab === 'all' ? <><path d="M3 10a9 9 0 1 1 1 7M3 4v6h6M12 7v5l4 2" /></> : <>
      <rect x="3" y="5" width="18" height="17" rx="2" /><path d="M7 2v6M17 2v6M3 10h18" />
      {tab === 'month' ? <><path d="M7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01" /><rect x="16" y="17" width="2" height="2" fill="currentColor" stroke="none" /></> : <path d="m7 14 2-1v6m4-5c0-2 4-2 4 0 0 1-4 3-4 5h4" />}
    </>}
  </svg>;
}

export function AppNavigation({ activeTab, onNavigate, t }: {
  activeTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  t: (key: string) => string;
}) {
  return <aside className="app-navigation">
    <div className="sidebar-brand"><img src="/app-icon.svg" alt="" /><span>{t('app.title')}</span></div>
    <nav aria-label={t('dashboard.navigation')}>
      {TABS.map(tab => <button key={tab.key} type="button" onClick={() => onNavigate(tab.key)} aria-current={activeTab === tab.key ? 'page' : undefined} className={`navigation-item ${activeTab === tab.key ? 'is-active' : ''}`}>
        <NavigationIcon tab={tab.key} /><span>{t(tab.labelKey)}</span>
      </button>)}
    </nav>
  </aside>;
}
