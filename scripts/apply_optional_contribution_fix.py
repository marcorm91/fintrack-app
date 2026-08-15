from pathlib import Path
import json
import re

hook = Path('src/hooks/useMonthlyForm.ts')
text = hook.read_text()
old = """      const portfolioContributionValue = hasInvestmentPortfolio
        ? parseAmount(form.portfolioContribution)
        : 0;
      if (
        hasInvestmentPortfolio &&
        (portfolioContributionValue === null || portfolioContributionValue < 0)
      ) {
"""
new = """      const portfolioContributionInput = form.portfolioContribution.trim();
      const portfolioContributionValue =
        hasInvestmentPortfolio && portfolioContributionInput !== ''
          ? parseAmount(form.portfolioContribution)
          : null;
      if (
        hasInvestmentPortfolio &&
        portfolioContributionInput !== '' &&
        (portfolioContributionValue === null || portfolioContributionValue < 0)
      ) {
"""
if old not in text:
    raise SystemExit('Contribution parsing block not found')
text = text.replace(old, new, 1)

old = """          portfolioContributionCents: hasInvestmentPortfolio
            ? Math.round((portfolioContributionValue ?? 0) * 100)
            : summary?.portfolioContributionCents ?? null,
"""
new = """          portfolioContributionCents: hasInvestmentPortfolio
            ? portfolioContributionValue === null
              ? null
              : Math.round(portfolioContributionValue * 100)
            : summary?.portfolioContributionCents ?? null,
"""
if old not in text:
    raise SystemExit('Contribution save block not found')
hook.write_text(text.replace(old, new, 1))

cargo_toml = Path('src-tauri/Cargo.toml')
text = cargo_toml.read_text()
text, count = re.subn(r'version = "3\.3\.2"', 'version = "3.3.3"', text, count=1)
if count != 1:
    raise SystemExit('Cargo.toml version not found')
cargo_toml.write_text(text)

cargo_lock = Path('src-tauri/Cargo.lock')
text = cargo_lock.read_text()
text, count = re.subn(
    r'(\[\[package\]\]\nname = "fintrack-app"\nversion = ")3\.3\.2(")',
    r'\g<1>3.3.3\2',
    text,
    count=1,
)
if count != 1:
    raise SystemExit('Cargo.lock fintrack version not found')
cargo_lock.write_text(text)

tauri_path = Path('src-tauri/tauri.conf.json')
tauri = json.loads(tauri_path.read_text())
tauri['version'] = '3.3.3'
tauri_path.write_text(json.dumps(tauri, ensure_ascii=False, indent=2) + '\n')

readme = Path('README.md')
text = readme.read_text().replace('3.3.2', '3.3.3')
marker = '- Separate monthly portfolio contributions from the real portfolio closing value, with automatic accumulated gain/loss tracking.\n'
addition = marker + '- Leave the monthly portfolio contribution empty to mark it as untracked; enter `0` to record an explicit zero contribution.\n'
if marker not in text:
    raise SystemExit('README investment marker not found')
readme.write_text(text.replace(marker, addition, 1))
