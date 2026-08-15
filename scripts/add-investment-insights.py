from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'Pattern not found in {path}: {old[:120]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


# Aggregate investment performance by year from the accumulated investment result.
replace_once(
    'src/hooks/useSeriesDerived.ts',
    "export type AllYearsPoint = {\n  year: string;\n  incomeCents: number;\n  expenseCents: number;\n  benefitCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  totalWealthCents: number;\n};",
    "export type AllYearsPoint = {\n  year: string;\n  incomeCents: number;\n  expenseCents: number;\n  benefitCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  totalWealthCents: number;\n  investmentResultCents?: number | null;\n};"
)
replace_once(
    'src/hooks/useSeriesDerived.ts',
    "export type YearTotals = {\n  incomeCents: number;\n  expenseCents: number;\n  benefitCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  totalWealthCents: number;\n};",
    "export type YearTotals = {\n  incomeCents: number;\n  expenseCents: number;\n  benefitCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  totalWealthCents: number;\n  investmentResultCents?: number | null;\n};"
)
replace_once(
    'src/hooks/useSeriesDerived.ts',
    "        totalWealth: number;\n        latestClosingBalanceMonth: string;",
    "        totalWealth: number;\n        investmentResult: number;\n        hasInvestmentResult: boolean;\n        latestClosingBalanceMonth: string;"
)
replace_once(
    'src/hooks/useSeriesDerived.ts',
    "    >();\n    for (const point of series) {",
    "    >();\n    let previousPortfolioResultCents: number | null = null;\n    for (const point of [...series].sort((a, b) => a.month.localeCompare(b.month))) {"
)
replace_once(
    'src/hooks/useSeriesDerived.ts',
    "          portfolio: 0,\n          totalWealth: 0,\n          latestClosingBalanceMonth: ''",
    "          portfolio: 0,\n          totalWealth: 0,\n          investmentResult: 0,\n          hasInvestmentResult: false,\n          latestClosingBalanceMonth: ''"
)
replace_once(
    'src/hooks/useSeriesDerived.ts',
    "      entry.benefit += point.benefitCents;\n      if (hasClosingBalanceEntry(point) && point.month > entry.latestClosingBalanceMonth) {",
    "      entry.benefit += point.benefitCents;\n      if (point.portfolioResultCents != null) {\n        entry.investmentResult += point.portfolioResultCents - (previousPortfolioResultCents ?? 0);\n        entry.hasInvestmentResult = true;\n        previousPortfolioResultCents = point.portfolioResultCents;\n      }\n      if (hasClosingBalanceEntry(point) && point.month > entry.latestClosingBalanceMonth) {"
)
replace_once(
    'src/hooks/useSeriesDerived.ts',
    "        portfolioCents: data.portfolio,\n        totalWealthCents: data.totalWealth\n      }));",
    "        portfolioCents: data.portfolio,\n        totalWealthCents: data.totalWealth,\n        investmentResultCents: data.hasInvestmentResult ? data.investmentResult : null\n      }));"
)
replace_once(
    'src/hooks/useSeriesDerived.ts',
    "      totalWealthCents: lastWealthSnapshot?.totalWealthCents ?? 0\n    };\n  }, [yearSeries]);",
    "      totalWealthCents: lastWealthSnapshot?.totalWealthCents ?? 0,\n      investmentResultCents: allYears.find((point) => point.year === yearValue)?.investmentResultCents ?? null\n    };\n  }, [allYears, yearSeries, yearValue]);"
)

# Monthly recap: show the investment result for the selected month when tracking is available.
replace_once(
    'src/components/MonthlyRecap.tsx',
    "function RecapMetric({\n  label,",
    "function PeriodResultMetric({ label, valueCents }: { label: string; valueCents: number }) {\n  const toneClass = valueCents > 0 ? 'text-benefit' : valueCents < 0 ? 'text-benefitNegative' : 'text-muted';\n  return (\n    <div className=\"rounded-xl bg-ink/[0.035] px-3 py-3 text-sm\">\n      <span className=\"text-muted\">{label}</span>\n      <p className={`mt-1.5 font-semibold ${toneClass}`}>\n        {valueCents > 0 ? '+' : ''}{formatAmount(valueCents)}\n      </p>\n    </div>\n  );\n}\n\nfunction RecapMetric({\n  label,"
)
replace_once(
    'src/components/MonthlyRecap.tsx',
    "  const previousPeriodLabel = getMonthLabel(previousMonth.month, locale).toUpperCase();\n  const headline =",
    "  const previousPeriodLabel = getMonthLabel(previousMonth.month, locale).toUpperCase();\n  const investmentTracked =\n    previousMonth.portfolioResultCents != null || summary.portfolioContributionCents != null;\n  const investmentResultCents = investmentTracked\n    ? summary.portfolioCents - previousMonth.portfolioCents - (summary.portfolioContributionCents ?? 0)\n    : null;\n  const headline ="
)
replace_once(
    'src/components/MonthlyRecap.tsx',
    "      <div className=\"mt-4 grid gap-2 border-t border-ink/10 pt-3 lg:grid-cols-3\">",
    "      <div className={`mt-4 grid gap-2 border-t border-ink/10 pt-3 ${investmentResultCents == null ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>"
)
replace_once(
    'src/components/MonthlyRecap.tsx',
    "        <RecapMetric\n          label={t('monthlyRecap.wealth')}\n          currentPeriodLabel={currentPeriodLabel}\n          previousPeriodLabel={previousPeriodLabel}\n          currentCents={summary.totalWealthCents}\n          previousCents={previousMonth.totalWealthCents}\n          tone={wealthDelta > 0 ? 'positive' : wealthDelta < 0 ? 'negative' : 'neutral'}\n        />\n      </div>",
    "        <RecapMetric\n          label={t('monthlyRecap.wealth')}\n          currentPeriodLabel={currentPeriodLabel}\n          previousPeriodLabel={previousPeriodLabel}\n          currentCents={summary.totalWealthCents}\n          previousCents={previousMonth.totalWealthCents}\n          tone={wealthDelta > 0 ? 'positive' : wealthDelta < 0 ? 'negative' : 'neutral'}\n        />\n        {investmentResultCents != null ? (\n          <PeriodResultMetric label={t('investment.monthResult')} valueCents={investmentResultCents} />\n        ) : null}\n      </div>"
)

# Annual recap: show the absolute portfolio result for the selected year, separate from year-over-year deltas.
replace_once(
    'src/components/YearRecap.tsx',
    "function RecapMetric({\n  label,",
    "function PeriodResultMetric({ label, valueCents }: { label: string; valueCents: number }) {\n  const toneClass = valueCents > 0 ? 'text-benefit' : valueCents < 0 ? 'text-benefitNegative' : 'text-muted';\n  return (\n    <div className=\"rounded-xl bg-ink/[0.035] px-3 py-3 text-sm\">\n      <span className=\"text-muted\">{label}</span>\n      <p className={`mt-1.5 font-semibold ${toneClass}`}>\n        {valueCents > 0 ? '+' : ''}{formatAmount(valueCents)}\n      </p>\n    </div>\n  );\n}\n\nfunction RecapMetric({\n  label,"
)
replace_once(
    'src/components/YearRecap.tsx',
    "      <div className=\"mt-4 grid gap-2 border-t border-ink/10 pt-3 lg:grid-cols-3\">",
    "      <div className={`mt-4 grid gap-2 border-t border-ink/10 pt-3 ${yearTotals.investmentResultCents == null ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>"
)
replace_once(
    'src/components/YearRecap.tsx',
    "        <RecapMetric\n          label={t('yearRecap.wealth')}\n          currentPeriodLabel={yearValue}\n          comparisonPeriodLabel={comparisonYear.year}\n          currentCents={yearTotals.totalWealthCents}\n          previousCents={comparisonYear.totalWealthCents}\n          tone={wealthDelta > 0 ? 'positive' : wealthDelta < 0 ? 'negative' : 'neutral'}\n        />\n      </div>",
    "        <RecapMetric\n          label={t('yearRecap.wealth')}\n          currentPeriodLabel={yearValue}\n          comparisonPeriodLabel={comparisonYear.year}\n          currentCents={yearTotals.totalWealthCents}\n          previousCents={comparisonYear.totalWealthCents}\n          tone={wealthDelta > 0 ? 'positive' : wealthDelta < 0 ? 'negative' : 'neutral'}\n        />\n        {yearTotals.investmentResultCents != null ? (\n          <PeriodResultMetric\n            label={t('investment.yearResult', { year: yearValue })}\n            valueCents={yearTotals.investmentResultCents}\n          />\n        ) : null}\n      </div>"
)

# Historical view: aggregate investment results inside the active year range and surface it beside existing insights.
replace_once(
    'src/features/history/HistoryView.tsx',
    "  totalWealthCents: number;\n  benefitCents: number;\n};\n\ntype HistoryTotals = {",
    "  totalWealthCents: number;\n  benefitCents: number;\n  investmentResultCents?: number | null;\n};\n\ntype HistoryTotals = {"
)
replace_once(
    'src/features/history/HistoryView.tsx',
    "  totalWealthCents: number;\n  benefitCents: number;\n};\n\ntype SeriesChartData",
    "  totalWealthCents: number;\n  benefitCents: number;\n  investmentResultCents: number | null;\n};\n\ntype SeriesChartData"
)
replace_once(
    'src/features/history/HistoryView.tsx',
    "        expenseCents: acc.expenseCents + point.expenseCents,\n        benefitCents: acc.benefitCents + point.benefitCents\n      }),",
    "        expenseCents: acc.expenseCents + point.expenseCents,\n        benefitCents: acc.benefitCents + point.benefitCents,\n        investmentResultCents:\n          point.investmentResultCents == null\n            ? acc.investmentResultCents\n            : (acc.investmentResultCents ?? 0) + point.investmentResultCents\n      }),"
)
replace_once(
    'src/features/history/HistoryView.tsx',
    "        totalWealthCents: 0,\n        benefitCents: 0\n      }",
    "        totalWealthCents: 0,\n        benefitCents: 0,\n        investmentResultCents: null\n      }"
)
old_history_block = '''          {bestBenefitYear && allYearsSeriesVisibility.benefit ? (
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                <TrendIcon trend="up" />
                <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                  {t('labels.bestBenefitYear', { year: bestBenefitYear.year })}
                  <span className="flex gap-1 items-center font-semibold text-benefit whitespace-nowrap">
                    <TrendIcon trend="right" /> {formatCents(bestBenefitYear.benefitCents)} EUR
                  </span>
                </span>
              </li>
              {worstBenefitYear && worstBenefitYear.year !== bestBenefitYear.year ? (
                <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                  <TrendIcon trend="down" />
                  <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                    {t('labels.worstBenefitYear', { year: worstBenefitYear.year })}
                    <span className="flex gap-1 items-center font-semibold text-benefitNegative whitespace-nowrap">
                      <TrendIcon trend="right" />
                      {formatCents(worstBenefitYear.benefitCents)} EUR
                    </span>
                  </span>
                </li>
              ) : null}
            </ul>
          ) : null}'''
new_history_block = '''          {(bestBenefitYear && allYearsSeriesVisibility.benefit) ||
          (hasInvestmentPortfolio && historyTotals.investmentResultCents != null) ? (
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {bestBenefitYear && allYearsSeriesVisibility.benefit ? (
                <>
                  <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                    <TrendIcon trend="up" />
                    <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                      {t('labels.bestBenefitYear', { year: bestBenefitYear.year })}
                      <span className="flex gap-1 items-center font-semibold text-benefit whitespace-nowrap">
                        <TrendIcon trend="right" /> {formatCents(bestBenefitYear.benefitCents)} EUR
                      </span>
                    </span>
                  </li>
                  {worstBenefitYear && worstBenefitYear.year !== bestBenefitYear.year ? (
                    <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                      <TrendIcon trend="down" />
                      <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                        {t('labels.worstBenefitYear', { year: worstBenefitYear.year })}
                        <span className="flex gap-1 items-center font-semibold text-benefitNegative whitespace-nowrap">
                          <TrendIcon trend="right" />
                          {formatCents(worstBenefitYear.benefitCents)} EUR
                        </span>
                      </span>
                    </li>
                  ) : null}
                </>
              ) : null}
              {hasInvestmentPortfolio && historyTotals.investmentResultCents != null ? (
                <li className={isMobile ? 'grid grid-cols-[16px_1fr] items-start gap-2' : 'flex items-center gap-2'}>
                  <TrendIcon trend={historyTotals.investmentResultCents >= 0 ? 'up' : 'down'} />
                  <span className={isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
                    {t('investment.historyResult')}
                    <span className={`flex items-center gap-1 font-semibold whitespace-nowrap ${
                      historyTotals.investmentResultCents >= 0 ? 'text-benefit' : 'text-benefitNegative'
                    }`}>
                      <TrendIcon trend="right" />
                      {historyTotals.investmentResultCents > 0 ? '+' : ''}{formatCents(historyTotals.investmentResultCents)} EUR
                    </span>
                  </span>
                </li>
              ) : null}
            </ul>
          ) : null}'''
replace_once('src/features/history/HistoryView.tsx', old_history_block, new_history_block)

# Translation copy.
replace_once(
    'src/locales/investment.ts',
    "    resultAccumulated: 'Accumulated result',\n    monthSaveDescription:",
    "    resultAccumulated: 'Accumulated result',\n    monthResult: 'Portfolio result this month',\n    yearResult: 'Portfolio result in {{year}}',\n    historyResult: 'Portfolio result in this period',\n    monthSaveDescription:"
)
replace_once(
    'src/locales/investment.ts',
    "    resultAccumulated: 'Resultado acumulado',\n    monthSaveDescription:",
    "    resultAccumulated: 'Resultado acumulado',\n    monthResult: 'Resultado de la cartera este mes',\n    yearResult: 'Resultado de la cartera en {{year}}',\n    historyResult: 'Resultado de la cartera en el periodo',\n    monthSaveDescription:"
)

print('Investment performance insights added.')
