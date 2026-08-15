from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        print(f'Optional fix pattern not found in {path}: {old[:100]!r}')
        return
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


# Existing app/test code builds MonthlySeriesPoint values without investment metadata.
# Keep those derived fields optional while DB-loaded series still populates them.
replace_once(
    'src/db/index.ts',
    "  portfolioContributionCents: number | null;\n  portfolioInvestedCents: number | null;\n  portfolioResultCents: number | null;\n  totalWealthCents: number;",
    "  portfolioContributionCents?: number | null;\n  portfolioInvestedCents?: number | null;\n  portfolioResultCents?: number | null;\n  totalWealthCents: number;"
)

# Mock seed type predates the new optional field.
replace_once(
    'src/db/index.ts',
    "          snapshot.portfolioContributionCents ?? null,\n          snapshot.note ?? ''",
    "          (snapshot as MonthlySnapshotInput).portfolioContributionCents ?? null,\n          snapshot.note ?? ''"
)

# The generic investment enricher must also accept old in-memory points.
replace_once(
    'src/utils/investment.ts',
    "  portfolioContributionCents: number | null;",
    "  portfolioContributionCents?: number | null;"
)
replace_once(
    'src/utils/investment.ts',
    "    const contribution = point.portfolioContributionCents;",
    "    const contribution = point.portfolioContributionCents ?? null;"
)

# MonthlySummary still requires a normalized nullable value.
replace_once(
    'src/utils/series.ts',
    "    portfolioContributionCents: point.portfolioContributionCents,",
    "    portfolioContributionCents: point.portfolioContributionCents ?? null,"
)

# Keep chart data numeric so existing chart component props remain compatible.
replace_once(
    'src/hooks/useCharts.ts',
    "type SeriesChartData = ChartData<'bar', Array<number | [number, number] | null>, string>;",
    "type SeriesChartData = ChartData<'bar', Array<number | null>, string>;"
)
replace_once(
    'src/hooks/useCharts.ts',
    "          data: yearSeries.map((point) =>\n            (point.portfolioInvestedCents ?? point.portfolioCents) / 100\n          ),",
    "          data: yearSeries.map((point) => {\n            if (point.portfolioInvestedCents == null || point.portfolioResultCents == null) {\n              return point.portfolioCents / 100;\n            }\n            return (point.portfolioResultCents < 0\n              ? point.portfolioCents\n              : point.portfolioInvestedCents) / 100;\n          }),"
)
replace_once(
    'src/hooks/useCharts.ts',
    "          data: yearSeries.map((point) => {\n            if (point.portfolioInvestedCents === null || point.portfolioResultCents === null) {\n              return null;\n            }\n            const invested = point.portfolioInvestedCents / 100;\n            const portfolio = point.portfolioCents / 100;\n            return point.portfolioResultCents >= 0\n              ? [invested, portfolio]\n              : [portfolio, invested];\n          }),",
    "          data: yearSeries.map((point) =>\n            point.portfolioResultCents == null\n              ? null\n              : Math.abs(point.portfolioResultCents) / 100\n          ),"
)

print('Investment contribution compatibility fixes applied.')
