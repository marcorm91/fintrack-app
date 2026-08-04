PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS monthly_snapshots (
  month TEXT PRIMARY KEY,
  income_cents INTEGER NOT NULL CHECK (income_cents >= 0),
  expense_cents INTEGER NOT NULL CHECK (expense_cents >= 0),
  balance_cents INTEGER NOT NULL,
  portfolio_cents INTEGER NOT NULL DEFAULT 0 CHECK (portfolio_cents >= 0),
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
