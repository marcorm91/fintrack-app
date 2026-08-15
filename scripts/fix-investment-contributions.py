from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        print(f'Optional fix pattern not found in {path}: {old[:100]!r}')
        return
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


replace_once(
    'src/db/index.ts',
    "export interface MonthlySummary {\n  month: string;\n  incomeCents: number;\n  expenseCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  totalWealthCents: number;\n  benefitCents: number;\n  note: string;\n}",
    "export interface MonthlySummary {\n  month: string;\n  incomeCents: number;\n  expenseCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  portfolioContributionCents: number | null;\n  totalWealthCents: number;\n  benefitCents: number;\n  note: string;\n}"
)

replace_once(
    'src/db/index.ts',
    "export interface MonthlySeriesPoint {\n  month: string;\n  incomeCents: number;\n  expenseCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  totalWealthCents: number;\n  benefitCents: number;\n  note: string;\n}",
    "export interface MonthlySeriesPoint {\n  month: string;\n  incomeCents: number;\n  expenseCents: number;\n  balanceCents: number;\n  portfolioCents: number;\n  portfolioContributionCents: number | null;\n  portfolioInvestedCents: number | null;\n  portfolioResultCents: number | null;\n  totalWealthCents: number;\n  benefitCents: number;\n  note: string;\n}"
)

print('Investment contribution compatibility fixes applied.')
