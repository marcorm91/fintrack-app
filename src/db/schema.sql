PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS monthly_snapshots (
  month TEXT PRIMARY KEY,
  income_cents INTEGER NOT NULL CHECK (income_cents >= 0),
  expense_cents INTEGER NOT NULL CHECK (expense_cents >= 0),
  balance_cents INTEGER NOT NULL
);
