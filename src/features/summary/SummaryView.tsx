import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import '../../utils/chartSetup';
import type { ChartOptions } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { MonthlySeriesPoint } from '../../db';
import type { AllYearsPoint } from '../../hooks/useSeriesDerived';
import { getDashboardPeriods } from '../../utils/dashboard';
import { formatCents, formatEuro, getBenefitClass } from '../../utils/format';
import { getMonthLabel } from '../../utils/date';
import { COLORS } from '../../constants';

type FlowTotals = { incomeCents: number; expenseCents: number; benefitCents: number };

function FlowMetrics({ totals }: { totals: FlowTotals }) {
  const { t } = useTranslation();
  return <dl className="dashboard-metrics">
    {(['income', 'expense', 'benefit'] as const).map(key => <div key={key}>
      <dt>{key !== 'benefit' && <span className={`metric-dot ${key === 'income' ? 'bg-benefit' : 'bg-expense'}`} />}{t(key === 'benefit' ? 'dashboard.balance' : `series.${key}`)}</dt>
      <dd className={key === 'benefit' ? getBenefitClass(totals.benefitCents) : ''}>{key === 'benefit' && totals.benefitCents > 0 ? '+' : ''}{formatCents(totals[`${key}Cents`])} <span>EUR</span></dd>
    </div>)}
  </dl>;
}

function DetailLink({ onClick, children }: { onClick: () => void; children: string }) {
  return <button type="button" className="dashboard-link" onClick={onClick}>{children}<span aria-hidden="true">→</span></button>;
}

export function SummaryView({ series, allYears, currentYear, onOpenMonth, onOpenYear, onOpenHistory, onCreateMonth }: {
  series: MonthlySeriesPoint[];
  allYears: AllYearsPoint[];
  currentYear: string;
  onOpenMonth: (month: string) => void;
  onOpenYear: (year: string) => void;
  onOpenHistory: () => void;
  onCreateMonth: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { latestMonth, yearSeries, yearTotals } = useMemo(() => getDashboardPeriods(series, currentYear), [series, currentYear]);
  const latestMonthFlowTotal = latestMonth ? Math.abs(latestMonth.incomeCents) + Math.abs(latestMonth.expenseCents) : 0;
  const incomeShare = latestMonthFlowTotal > 0 && latestMonth ? Math.abs(latestMonth.incomeCents) / latestMonthFlowTotal * 100 : 0;
  const expenseShare = latestMonthFlowTotal > 0 && latestMonth ? Math.abs(latestMonth.expenseCents) / latestMonthFlowTotal * 100 : 0;
  const historyTickStep = allYears.length <= 8 ? 1 : Math.ceil((allYears.length - 1) / 7);
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${formatEuro(context.parsed.y ?? 0)} EUR` } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: COLORS.tick, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
      y: { beginAtZero: true, border: { display: false }, grid: { color: COLORS.grid }, ticks: { maxTicksLimit: 4, color: COLORS.tick, callback: value => formatEuro(Number(value)) } }
    }
  };
  const historyOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${formatEuro(context.parsed.y ?? 0)} EUR` } } },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: COLORS.tick,
          maxRotation: 0,
          autoSkip: false,
          callback: (_value, index) => index % historyTickStep === 0 || index === allYears.length - 1 ? allYears[index]?.year ?? '' : ''
        }
      },
      y: { beginAtZero: true, border: { display: false }, grid: { color: COLORS.grid }, ticks: { maxTicksLimit: 4, color: COLORS.tick, callback: value => formatEuro(Number(value)) } }
    }
  };
  return <div className="dashboard-periods">
    <section className="dashboard-card">
      <div className="dashboard-card-heading">
        <div><h2>{t('dashboard.latestMonth')}</h2>{latestMonth && <p className="capitalize">{getMonthLabel(latestMonth.month, i18n.language, 'long')} {latestMonth.month.slice(0, 4)}</p>}</div>
        {latestMonth && <DetailLink onClick={() => onOpenMonth(latestMonth.month)}>{t('dashboard.viewMonth')}</DetailLink>}
      </div>
      {latestMonth ? <>
        <FlowMetrics totals={latestMonth} />
        <div className="pb-[6px] pt-[22px]" aria-hidden="true">
          <div className="mb-2 flex items-center justify-between gap-4 text-[10px] text-muted">
            <span>{Math.round(incomeShare)}%</span>
            <span>{Math.round(expenseShare)}%</span>
          </div>
          <div className="flow-track flow-track-stacked flex">
            <span className="bg-benefit" style={{ width: `${incomeShare}%` }} />
            <span className="bg-expense" style={{ width: `${expenseShare}%` }} />
          </div>
        </div>
      </> : <div className="dashboard-empty"><p>{t('dashboard.emptyMonth')}</p><DetailLink onClick={onCreateMonth}>{t('dashboard.createMonth')}</DetailLink></div>}
    </section>
    <section className="dashboard-card">
      <div className="dashboard-card-heading"><div><h2>{t('labels.currentYear')}</h2><p>{currentYear}</p></div><DetailLink onClick={() => onOpenYear(currentYear)}>{t('dashboard.viewYear')}</DetailLink></div>
      {yearSeries.length ? <>
        <FlowMetrics totals={yearTotals} />
        <div className="dashboard-chart annual-chart">
          <Bar role="img" aria-label={t('dashboard.annualChart')} options={chartOptions} data={{
            labels: yearSeries.map(point => getMonthLabel(point.month, i18n.language)),
            datasets: [
              { label: t('series.income'), data: yearSeries.map(p => p.incomeCents / 100), backgroundColor: COLORS.benefit, borderRadius: 2 },
              { label: t('series.expense'), data: yearSeries.map(p => p.expenseCents / 100), backgroundColor: COLORS.expense, borderRadius: 2 }
            ]
          }} />
        </div>
        <div className="sr-only"><table><caption>{t('dashboard.annualChart')}</caption><thead><tr><th>{t('labels.month')}</th><th>{t('series.income')}</th><th>{t('series.expense')}</th></tr></thead><tbody>{yearSeries.map(p => <tr key={p.month}><th>{p.month}</th><td>{formatCents(p.incomeCents)} EUR</td><td>{formatCents(p.expenseCents)} EUR</td></tr>)}</tbody></table></div>
      </> : <p className="dashboard-empty">{t('dashboard.emptyYear')}</p>}
    </section>
    <section className="dashboard-card history-overview">
      <div className="dashboard-card-heading"><div><h2>{t('tabs.all')}</h2>{allYears.length > 0 && <p>{allYears[0].year}–{allYears[allYears.length - 1].year}</p>}</div><DetailLink onClick={onOpenHistory}>{t('dashboard.viewHistory')}</DetailLink></div>
      {allYears.length ? <>
        <div className="dashboard-chart history-chart"><Line role="img" aria-label={t('dashboard.historyChart')} options={historyOptions} data={{
          labels: allYears.map(p => p.year),
          datasets: [{ label: t('series.totalWealth'), data: allYears.map(p => p.totalWealthCents / 100), borderColor: COLORS.benefit, backgroundColor: 'rgba(34,185,132,0.12)', fill: true, borderWidth: 2, pointRadius: 3, pointBackgroundColor: COLORS.benefit, tension: 0.15 }]
        }} /></div>
        <div className="sr-only"><table><caption>{t('dashboard.historyChart')}</caption><thead><tr><th>{t('labels.year')}</th><th>{t('series.totalWealth')}</th></tr></thead><tbody>{allYears.map(p => <tr key={p.year}><th>{p.year}</th><td>{formatCents(p.totalWealthCents)} EUR</td></tr>)}</tbody></table></div>
      </> : <p className="dashboard-empty">{t('dashboard.emptyHistory')}</p>}
    </section>
  </div>;
}
