from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'Pattern not found in {path}: {old[:120]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


def replace_all(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'Pattern not found in {path}: {old[:120]!r}')
    file.write_text(text.replace(old, new), encoding='utf-8')


# Form state.
replace_once(
    'src/types.ts',
    "  portfolio: string;\n  note: string;",
    "  portfolio: string;\n  portfolioContribution: string;\n  note: string;"
)

# SQLite schema: nullable keeps legacy rows distinguishable from explicit zero contributions.
replace_once(
    'src/db/schema.sql',
    "  portfolio_cents INTEGER NOT NULL DEFAULT 0 CHECK (portfolio_cents >= 0),\n  note TEXT NOT NULL DEFAULT '',",
    "  portfolio_cents INTEGER NOT NULL DEFAULT 0 CHECK (portfolio_cents >= 0),\n  portfolio_contribution_cents INTEGER CHECK (portfolio_contribution_cents >= 0),\n  note TEXT NOT NULL DEFAULT '',"
)

# Translation namespace.
replace_once(
    'src/i18n.ts',
    "import { yearRecapTranslations } from './locales/yearRecap';",
    "import { yearRecapTranslations } from './locales/yearRecap';\nimport { investmentTranslations } from './locales/investment';"
)
replace_once(
    'src/i18n.ts',
    "    en: { translation: { ...en, monthlyRecap: monthlyRecapTranslations.en, yearRecap: yearRecapTranslations.en } },\n    es: { translation: { ...es, monthlyRecap: monthlyRecapTranslations.es, yearRecap: yearRecapTranslations.es } }",
    "    en: { translation: { ...en, monthlyRecap: monthlyRecapTranslations.en, yearRecap: yearRecapTranslations.en, investment: investmentTranslations.en } },\n    es: { translation: { ...es, monthlyRecap: monthlyRecapTranslations.es, yearRecap: yearRecapTranslations.es, investment: investmentTranslations.es } }"
)

# Monthly form state/load/save.
replace_once(
    'src/hooks/useMonthlyForm.ts',
    "  portfolio: '',\n  note: ''",
    "  portfolio: '',\n  portfolioContribution: '',\n  note: ''"
)
replace_once(
    'src/hooks/useMonthlyForm.ts',
    "        portfolio: monthSummary.portfolioCents ? formatInputCents(monthSummary.portfolioCents) : '',\n        note: monthSummary.note",
    "        portfolio: monthSummary.portfolioCents ? formatInputCents(monthSummary.portfolioCents) : '',\n        portfolioContribution:\n          monthSummary.portfolioContributionCents === null\n            ? ''\n            : formatInputCents(monthSummary.portfolioContributionCents),\n        note: monthSummary.note"
)
replace_once(
    'src/hooks/useMonthlyForm.ts',
    "        portfolio: fallbackWealthSummary.portfolioCents ? formatInputCents(fallbackWealthSummary.portfolioCents) : '',\n        note: ''",
    "        portfolio: fallbackWealthSummary.portfolioCents ? formatInputCents(fallbackWealthSummary.portfolioCents) : '',\n        portfolioContribution: '',\n        note: ''"
)
replace_once(
    'src/hooks/useMonthlyForm.ts',
    "      const portfolioValue = hasInvestmentPortfolio ? parseAmount(form.portfolio) : null;\n      if (hasInvestmentPortfolio && (portfolioValue === null || portfolioValue < 0)) {\n          setError(t('errors.invalidPortfolio'));\n          return;\n      }",
    "      const portfolioValue = hasInvestmentPortfolio ? parseAmount(form.portfolio) : null;\n      if (hasInvestmentPortfolio && (portfolioValue === null || portfolioValue < 0)) {\n        setError(t('errors.invalidPortfolio'));\n        return;\n      }\n\n      const portfolioContributionValue = hasInvestmentPortfolio\n        ? parseAmount(form.portfolioContribution)\n        : 0;\n      if (\n        hasInvestmentPortfolio &&\n        (portfolioContributionValue === null || portfolioContributionValue < 0)\n      ) {\n        setError(t('investment.invalidContribution'));\n        return;\n      }"
)
replace_once(
    'src/hooks/useMonthlyForm.ts',
    "          portfolioCents: hasInvestmentPortfolio\n            ? Math.round((portfolioValue ?? 0) * 100)\n            : summary?.portfolioCents ?? fallbackWealthSummary?.portfolioCents ?? 0,\n          note:",
    "          portfolioCents: hasInvestmentPortfolio\n            ? Math.round((portfolioValue ?? 0) * 100)\n            : summary?.portfolioCents ?? fallbackWealthSummary?.portfolioCents ?? 0,\n          portfolioContributionCents: hasInvestmentPortfolio\n            ? Math.round((portfolioContributionValue ?? 0) * 100)\n            : summary?.portfolioContributionCents ?? null,\n          note:"
)

# Monthly form UI: split movements from closing wealth and add contribution input.
replace_once(
    'src/features/month/MonthView.tsx',
    "{t('descriptions.monthSave')}",
    "{t('investment.monthSaveDescription')}"
)
replace_once(
    'src/features/month/MonthView.tsx',
    "{t('labels.monthCashFlow')}",
    "{t('investment.monthMovements')}"
)
contribution_field = '''          <label className={`mt-2 block rounded-xl border border-ink/5 bg-white/90 text-muted ${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-portfolio" />
              {t('investment.portfolioContribution')}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder={t('placeholders.amount')}
              value={form.portfolioContribution}
              onChange={onFormChange('portfolioContribution')}
              disabled={readOnly || !hasInvestmentPortfolio}
              className={`mt-2 w-full rounded-xl border border-ink/5 bg-white text-ink shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-muted ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'}`}
            />
          </label>
'''
replace_once(
    'src/features/month/MonthView.tsx',
    "          </div>\n        </fieldset>\n        <fieldset className={`border border-balance/15",
    "          </div>\n" + contribution_field + "        </fieldset>\n        <fieldset className={`border border-balance/15"
)
replace_once(
    'src/features/month/MonthView.tsx',
    "{t('labels.wealth')}",
    "{t('investment.closingWealth')}"
)
replace_once(
    'src/features/month/MonthView.tsx',
    "                  {t('series.portfolio')}\n                </span>\n                <input\n                  type=\"number\"",
    "                  {t('investment.closingPortfolio')}\n                </span>\n                <input\n                  type=\"number\""
)

# Core DB types and SQL.
replace_once(
    'src/db/index.ts',
    "import { isMobilePlatform } from '../utils/platform';",
    "import { isMobilePlatform } from '../utils/platform';\nimport { enrichInvestmentPerformance } from '../utils/investment';"
)
replace_all(
    'src/db/index.ts',
    "  portfolioCents: number;\n  note: string;",
    "  portfolioCents: number;\n  portfolioContributionCents: number | null;\n  note: string;"
)
replace_once(
    'src/db/index.ts',
    "export interface MonthlySeriesPoint {\n  month: string;\n  incomeCents: number;\n  expenseCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  portfolioContributionCents: number | null;\n  totalWealthCents: number;\n  benefitCents: number;\n  note: string;\n}",
    "export interface MonthlySeriesPoint {\n  month: string;\n  incomeCents: number;\n  expenseCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  portfolioContributionCents: number | null;\n  portfolioInvestedCents: number | null;\n  portfolioResultCents: number | null;\n  totalWealthCents: number;\n  benefitCents: number;\n  note: string;\n}"
)
replace_once(
    'src/db/index.ts',
    "  portfolioCents?: number;\n  note?: string;",
    "  portfolioCents?: number;\n  portfolioContributionCents?: number | null;\n  note?: string;"
)
replace_all(
    'src/db/index.ts',
    "  portfolio_cents,\n  note",
    "  portfolio_cents,\n  portfolio_contribution_cents,\n  note"
)
replace_once(
    'src/db/index.ts',
    "SELECT balance_cents, portfolio_cents, note",
    "SELECT balance_cents, portfolio_cents, portfolio_contribution_cents, note"
)
replace_once(
    'src/db/index.ts',
    "VALUES (?, ?, ?, ?, ?, ?, 0, 1,",
    "VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1,"
)
replace_once(
    'src/db/index.ts',
    "  portfolio_cents = excluded.portfolio_cents,\n  note = excluded.note,",
    "  portfolio_cents = excluded.portfolio_cents,\n  portfolio_contribution_cents = excluded.portfolio_contribution_cents,\n  note = excluded.note,"
)
replace_all(
    'src/db/index.ts',
    "VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'synced')",
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'synced')"
)
replace_all(
    'src/db/index.ts',
    "  portfolio_cents = excluded.portfolio_cents,\n  note = excluded.note,",
    "  portfolio_cents = excluded.portfolio_cents,\n  portfolio_contribution_cents = excluded.portfolio_contribution_cents,\n  note = excluded.note,"
)
replace_once(
    'src/db/index.ts',
    "    portfolioCents,\n    totalWealthCents:",
    "    portfolioCents,\n    portfolioContributionCents: snapshot.portfolioContributionCents ?? null,\n    totalWealthCents:"
)
replace_once(
    'src/db/index.ts',
    "function seriesFromSnapshot(snapshot: MonthlySnapshotInput): MonthlySeriesPoint {\n  return summaryFromSnapshot(snapshot);\n}",
    "function seriesFromSnapshot(snapshot: MonthlySnapshotInput): MonthlySeriesPoint {\n  return {\n    ...summaryFromSnapshot(snapshot),\n    portfolioInvestedCents: null,\n    portfolioResultCents: null\n  };\n}"
)
replace_once(
    'src/db/index.ts',
    "  portfolio_cents: number;\n  note: string;\n  version:",
    "  portfolio_cents: number;\n  portfolio_contribution_cents: number | null;\n  note: string;\n  version:"
)
replace_once(
    'src/db/index.ts',
    "    portfolioCents: row.portfolio_cents,\n    note: row.note,",
    "    portfolioCents: row.portfolio_cents,\n    portfolioContributionCents: row.portfolio_contribution_cents ?? null,\n    note: row.note,"
)
replace_once(
    'src/db/index.ts',
    "  if (!existingColumns.has('note')) {",
    "  if (!existingColumns.has('portfolio_contribution_cents')) {\n    await db.execute(\n      'ALTER TABLE monthly_snapshots ADD COLUMN portfolio_contribution_cents INTEGER CHECK (portfolio_contribution_cents >= 0);'\n    );\n  }\n  if (!existingColumns.has('note')) {"
)
# Seed/upsert argument: contribution before note.
replace_once(
    'src/db/index.ts',
    "          snapshot.portfolioCents,\n          snapshot.note ?? ''",
    "          snapshot.portfolioCents,\n          snapshot.portfolioContributionCents ?? null,\n          snapshot.note ?? ''"
)
# Summary row typing/mapping.
replace_once(
    'src/db/index.ts',
    "    portfolio_cents?: number;\n    note?: string;\n  }>>(MONTHLY_SUMMARY_SQL",
    "    portfolio_cents?: number;\n    portfolio_contribution_cents?: number | null;\n    note?: string;\n  }>>(MONTHLY_SUMMARY_SQL"
)
replace_once(
    'src/db/index.ts',
    "    portfolioCents,\n    totalWealthCents: balanceCents + portfolioCents,",
    "    portfolioCents,\n    portfolioContributionCents: row.portfolio_contribution_cents ?? null,\n    totalWealthCents: balanceCents + portfolioCents,"
)
# Series row typing/mapping and enrichment.
replace_once(
    'src/db/index.ts',
    "    portfolio_cents?: number;\n    note?: string;\n  }>>(MONTHLY_SERIES_SQL);",
    "    portfolio_cents?: number;\n    portfolio_contribution_cents?: number | null;\n    note?: string;\n  }>>(MONTHLY_SERIES_SQL);"
)
replace_once(
    'src/db/index.ts',
    "  return rows.map((row) => {",
    "  const points = rows.map((row): MonthlySeriesPoint => {"
)
replace_once(
    'src/db/index.ts',
    "      portfolioCents,\n      totalWealthCents: balanceCents + portfolioCents,",
    "      portfolioCents,\n      portfolioContributionCents: row.portfolio_contribution_cents ?? null,\n      portfolioInvestedCents: null,\n      portfolioResultCents: null,\n      totalWealthCents: balanceCents + portfolioCents,"
)
replace_once(
    'src/db/index.ts',
    "    };\n  });\n}\n\nexport async function saveMonthlySnapshot",
    "    };\n  });\n  return enrichInvestmentPerformance(points);\n}\n\nexport async function saveMonthlySnapshot"
)
# Mock series enrichment.
replace_once(
    'src/db/index.ts',
    "    return [...snapshots].sort((a, b) => a.month.localeCompare(b.month)).map(seriesFromSnapshot);",
    "    return enrichInvestmentPerformance(\n      [...snapshots].sort((a, b) => a.month.localeCompare(b.month)).map(seriesFromSnapshot)\n    );"
)
# Existing row includes contribution for preserving edits.
replace_once(
    'src/db/index.ts',
    "    const existingRows = await db.select<Array<{ balance_cents?: number; portfolio_cents?: number; note?: string }>>(MONTHLY_WEALTH_SQL, [",
    "    const existingRows = await db.select<Array<{ balance_cents?: number; portfolio_cents?: number; portfolio_contribution_cents?: number | null; note?: string }>>(MONTHLY_WEALTH_SQL, ["
)
replace_once(
    'src/db/index.ts',
    "  let portfolioCents = input.portfolioCents;\n  let note = input.note;\n  if (portfolioCents === undefined || note === undefined) {",
    "  let portfolioCents = input.portfolioCents;\n  let portfolioContributionCents = input.portfolioContributionCents;\n  let note = input.note;\n  if (portfolioCents === undefined || portfolioContributionCents === undefined || note === undefined) {"
)
replace_once(
    'src/db/index.ts',
    "    note = note ?? existingRow?.note ?? '';\n  }",
    "    if (portfolioContributionCents === undefined) {\n      portfolioContributionCents = existingRow?.portfolio_contribution_cents ?? null;\n    }\n    note = note ?? existingRow?.note ?? '';\n  }"
)
replace_once(
    'src/db/index.ts',
    "    portfolioCents,\n    normalizeSnapshotNote(note)",
    "    portfolioCents,\n    portfolioContributionCents ?? null,\n    normalizeSnapshotNote(note)"
)
# Mock save preserves/sets contribution.
replace_once(
    'src/db/index.ts',
    "      portfolioCents: previousPortfolioCents,\n      note:",
    "      portfolioCents: previousPortfolioCents,\n      portfolioContributionCents:\n        input.portfolioContributionCents ?? snapshots[index]?.portfolioContributionCents ?? null,\n      note:"
)
# Remote apply parameters.
replace_all(
    'src/db/index.ts',
    "    input.portfolioCents,\n    normalizeSnapshotNote(input.note),\n    input.version,",
    "    input.portfolioCents,\n    input.portfolioContributionCents,\n    normalizeSnapshotNote(input.note),\n    input.version,"
)

# Padded year points and summary conversion.
replace_once(
    'src/utils/series.ts',
    "    portfolioCents: point.portfolioCents,\n    totalWealthCents:",
    "    portfolioCents: point.portfolioCents,\n    portfolioContributionCents: point.portfolioContributionCents,\n    totalWealthCents:"
)
replace_once(
    'src/utils/series.ts',
    "        portfolioCents: 0,\n        totalWealthCents: 0,",
    "        portfolioCents: 0,\n        portfolioContributionCents: null,\n        portfolioInvestedCents: null,\n        portfolioResultCents: null,\n        totalWealthCents: 0,"
)

# Chart colors.
replace_once(
    'src/constants.ts',
    "  portfolio: '#f4bc45',\n  totalWealth:",
    "  portfolio: '#f4bc45',\n  portfolioGain: '#8adbb8',\n  portfolioLoss: '#f59baa',\n  totalWealth:"
)

# Wealth chart: retain blue and dark bars, decompose only portfolio slot.
replace_once(
    'src/hooks/useCharts.ts',
    "type SeriesChartData = ChartData<'bar', Array<number | null>, string>;",
    "type SeriesChartData = ChartData<'bar', Array<number | [number, number] | null>, string>;"
)
old_portfolio_dataset = '''        {
          label: translate('series.portfolio'),
          data: yearSeries.map((point) => point.portfolioCents / 100),
          backgroundColor: COLORS.portfolio,
          borderColor: COLORS.portfolio,
          pointBackgroundColor: COLORS.portfolio,
          borderWidth: 0,
          borderRadius: 4,
          hidden: !yearSeriesVisibility.portfolio
        },'''
new_portfolio_datasets = '''        {
          label: translate('investment.investedAccumulated'),
          data: yearSeries.map((point) =>
            (point.portfolioInvestedCents ?? point.portfolioCents) / 100
          ),
          backgroundColor: COLORS.portfolio,
          borderColor: COLORS.portfolio,
          pointBackgroundColor: COLORS.portfolio,
          borderWidth: 0,
          borderRadius: 4,
          stack: 'portfolio',
          hidden: !yearSeriesVisibility.portfolio
        },
        {
          label: translate('investment.resultAccumulated'),
          data: yearSeries.map((point) => {
            if (point.portfolioInvestedCents === null || point.portfolioResultCents === null) {
              return null;
            }
            const invested = point.portfolioInvestedCents / 100;
            const portfolio = point.portfolioCents / 100;
            return point.portfolioResultCents >= 0
              ? [invested, portfolio]
              : [portfolio, invested];
          }),
          backgroundColor: yearSeries.map((point) =>
            (point.portfolioResultCents ?? 0) < 0 ? COLORS.portfolioLoss : COLORS.portfolioGain
          ),
          borderColor: yearSeries.map((point) =>
            (point.portfolioResultCents ?? 0) < 0 ? COLORS.portfolioLoss : COLORS.portfolioGain
          ),
          borderWidth: 0,
          borderRadius: 4,
          stack: 'portfolio',
          hidden: !yearSeriesVisibility.portfolio
        },'''
replace_once('src/hooks/useCharts.ts', old_portfolio_dataset, new_portfolio_datasets)

# Cloud sync: optional nullable field keeps old clients/documents compatible.
replace_once(
    'src/services/cloudSync.ts',
    "    !isSafeInteger(value.portfolioCents) ||\n    value.portfolioCents < 0 ||",
    "    !isSafeInteger(value.portfolioCents) ||\n    value.portfolioCents < 0 ||\n    !(\n      value.portfolioContributionCents === undefined ||\n      value.portfolioContributionCents === null ||\n      (isSafeInteger(value.portfolioContributionCents) && value.portfolioContributionCents >= 0)\n    ) ||"
)
replace_once(
    'src/services/cloudSync.ts',
    "    portfolioCents: value.portfolioCents,\n    note:",
    "    portfolioCents: value.portfolioCents,\n    portfolioContributionCents: value.portfolioContributionCents ?? null,\n    note:"
)
replace_once(
    'src/services/cloudSync.ts',
    "    local.portfolioCents === remote.portfolioCents &&\n    local.note",
    "    local.portfolioCents === remote.portfolioCents &&\n    local.portfolioContributionCents === remote.portfolioContributionCents &&\n    local.note"
)
replace_once(
    'src/services/cloudSync.ts',
    "      portfolioCents: local.portfolioCents,\n      note:",
    "      portfolioCents: local.portfolioCents,\n      portfolioContributionCents: local.portfolioContributionCents,\n      note:"
)

# Firestore rules accept old documents without the field and new nullable/int documents.
replace_once(
    'firestore.rules',
    "          'portfolioCents',\n          'note',",
    "          'portfolioCents',\n          'portfolioContributionCents',\n          'note',"
)
replace_once(
    'firestore.rules',
    "        && data.portfolioCents >= 0\n        && data.note is string",
    "        && data.portfolioCents >= 0\n        && (!data.keys().hasAny(['portfolioContributionCents'])\n          || data.portfolioContributionCents == null\n          || (data.portfolioContributionCents is int && data.portfolioContributionCents >= 0))\n        && data.note is string"
)

# JSON backup stays format v1 but adds an optional field so old backups remain valid.
replace_once(
    'src/utils/backup.ts',
    "    portfolioCents: number;\n    note: string;",
    "    portfolioCents: number;\n    portfolioContributionCents?: number | null;\n    note: string;"
)
replace_once(
    'src/utils/backup.ts',
    "      portfolioCents: point.portfolioCents,\n      note:",
    "      portfolioCents: point.portfolioCents,\n      portfolioContributionCents: point.portfolioContributionCents,\n      note:"
)
replace_once(
    'src/utils/backup.ts',
    "    (left.portfolioCents ?? 0) === (right.portfolioCents ?? 0) &&\n    (left.note",
    "    (left.portfolioCents ?? 0) === (right.portfolioCents ?? 0) &&\n    (left.portfolioContributionCents ?? null) === (right.portfolioContributionCents ?? null) &&\n    (left.note"
)
replace_once(
    'src/utils/backup.ts',
    "    const { month, incomeCents, expenseCents, balanceCents, portfolioCents, note } = snapshot;",
    "    const { month, incomeCents, expenseCents, balanceCents, portfolioCents, portfolioContributionCents, note } = snapshot;"
)
replace_once(
    'src/utils/backup.ts',
    "      !isSafeInteger(portfolioCents) ||\n      portfolioCents < 0 ||\n      typeof note",
    "      !isSafeInteger(portfolioCents) ||\n      portfolioCents < 0 ||\n      !(\n        portfolioContributionCents === undefined ||\n        portfolioContributionCents === null ||\n        (isSafeInteger(portfolioContributionCents) && portfolioContributionCents >= 0)\n      ) ||\n      typeof note"
)
replace_once(
    'src/utils/backup.ts',
    "      portfolioCents,\n      note\n    };",
    "      portfolioCents,\n      portfolioContributionCents: portfolioContributionCents ?? null,\n      note\n    };"
)

# CSV export/import: header-based new column; legacy CSV without it remains valid.
replace_once(
    'src/utils/export.ts',
    "  es: ['mes', 'ingresos', 'gastos', 'saldo al cierre', 'cartera al cierre', 'nota'],\n  en: ['month', 'income', 'expenses', 'closing balance', 'portfolio closing value', 'note']",
    "  es: ['mes', 'ingresos', 'gastos', 'saldo al cierre', 'aportación a cartera', 'cartera al cierre', 'nota'],\n  en: ['month', 'income', 'expenses', 'closing balance', 'portfolio contribution', 'portfolio closing value', 'note']"
)
replace_once(
    'src/utils/export.ts',
    "        formatCsvNumber(point.balanceCents, locale),\n        formatCsvNumber(point.portfolioCents, locale),",
    "        formatCsvNumber(point.balanceCents, locale),\n        point.portfolioContributionCents === null\n          ? ''\n          : formatCsvNumber(point.portfolioContributionCents, locale),\n        formatCsvNumber(point.portfolioCents, locale),"
)
replace_once(
    'src/utils/export.ts',
    "INSERT INTO monthly_snapshots (month, income_cents, expense_cents, balance_cents, portfolio_cents, note) VALUES ('${escapeSqlValue(",
    "INSERT INTO monthly_snapshots (month, income_cents, expense_cents, balance_cents, portfolio_cents, portfolio_contribution_cents, note) VALUES ('${escapeSqlValue("
)
replace_once(
    'src/utils/export.ts',
    "        )}', ${point.incomeCents}, ${point.expenseCents}, ${point.balanceCents}, ${point.portfolioCents}, '${escapeSqlValue(point.note)}');`",
    "        )}', ${point.incomeCents}, ${point.expenseCents}, ${point.balanceCents}, ${point.portfolioCents}, ${point.portfolioContributionCents ?? 'NULL'}, '${escapeSqlValue(point.note)}');`"
)
replace_once(
    'src/utils/csv.ts',
    "  portfolio: ['portfolio', 'cartera', 'inversiones', 'cartera al cierre'],\n  note:",
    "  portfolio: ['portfolio', 'cartera', 'inversiones', 'cartera al cierre'],\n  portfolioContribution: ['portfolio contribution', 'aportacion a cartera', 'aporte a cartera'],\n  note:"
)
replace_once(
    'src/utils/csv.ts',
    "  let portfolioIndex = 4;\n  let yearIndex = -1;\n  let noteIndex = 5;",
    "  let portfolioIndex = 4;\n  let portfolioContributionIndex = -1;\n  let yearIndex = -1;\n  let noteIndex = 5;"
)
replace_once(
    'src/utils/csv.ts',
    "    portfolioIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.portfolio);\n    noteIndex =",
    "    portfolioIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.portfolio);\n    portfolioContributionIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.portfolioContribution);\n    noteIndex ="
)
replace_once(
    'src/utils/csv.ts',
    "    const portfolio = parsePortfolioValue(row, portfolioIndex, usePortfolioColumn);\n    if (",
    "    const portfolio = parsePortfolioValue(row, portfolioIndex, usePortfolioColumn);\n    const portfolioContribution =\n      portfolioContributionIndex < 0\n        ? undefined\n        : parseLooseNumber(row[portfolioContributionIndex] ?? '');\n    if ("
)
replace_once(
    'src/utils/csv.ts',
    "      portfolio === null\n    ) {",
    "      portfolio === null ||\n      (portfolioContribution !== undefined &&\n        (portfolioContribution === null || portfolioContribution < 0))\n    ) {"
)
replace_once(
    'src/utils/csv.ts',
    "      portfolioCents: portfolio === undefined ? undefined : Math.round(portfolio * 100),\n      note:",
    "      portfolioCents: portfolio === undefined ? undefined : Math.round(portfolio * 100),\n      portfolioContributionCents:\n        portfolioContribution === undefined || portfolioContribution === null\n          ? undefined\n          : Math.round(portfolioContribution * 100),\n      note:"
)

print('Investment contribution changes applied.')
