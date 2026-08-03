import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import schemaSql from './schema.sql?raw';

export const DATABASE_FILENAME = 'finanzas.db';
export const MOCK_DATABASE_FILENAME = 'finanzas.mocks.db';
const DB_PATH_STORAGE_KEY = 'fintrack.dbPath';
const MOCK_INVESTMENT_PORTFOLIO_STORAGE_KEY = 'fintrack.mockInvestmentPortfolioEnabled';

function shouldUseMockDatabase() {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DB === 'true';
}

function loadStoredDatabasePath() {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(DB_PATH_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  const trimmed = stored.trim();
  return trimmed.length ? trimmed : null;
}

let dbPath: string | null = shouldUseMockDatabase() ? MOCK_DATABASE_FILENAME : loadStoredDatabasePath();
let dbUrl: string | null = dbPath ? `sqlite:${dbPath}` : null;
let dbUrlPromise: Promise<string> | null = null;
let portableMode = false;

export function getDatabasePath() {
  if (shouldUseMockDatabase()) {
    return MOCK_DATABASE_FILENAME;
  }
  return dbPath;
}

export function isPortableMode() {
  return portableMode;
}

async function resolvePortableDatabasePath(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const portablePath = await invoke<string | null>('resolve_portable_db_path');
    if (!portablePath) {
      return null;
    }
    const trimmed = portablePath.trim();
    return trimmed.length ? trimmed : null;
  } catch {
    return null;
  }
}

export async function resolveDatabasePath(): Promise<string | null> {
  if (shouldUseMockDatabase()) {
    return MOCK_DATABASE_FILENAME;
  }
  if (dbPath) {
    return dbPath;
  }
  const portablePath = await resolvePortableDatabasePath();
  if (portablePath) {
    portableMode = true;
    dbPath = portablePath;
    dbUrl = `sqlite:${portablePath}`;
    return portablePath;
  }
  return null;
}

async function resolveDatabaseUrl(): Promise<string> {
  if (shouldUseMockDatabase()) {
    return `sqlite:${MOCK_DATABASE_FILENAME}`;
  }
  if (dbUrl) {
    return dbUrl;
  }
  if (!dbUrlPromise) {
    dbUrlPromise = (async () => {
      if (dbPath) {
        return `sqlite:${dbPath}`;
      }
      const portablePath = await resolvePortableDatabasePath();
      if (portablePath) {
        portableMode = true;
        dbPath = portablePath;
        return `sqlite:${portablePath}`;
      }
      return `sqlite:${DATABASE_FILENAME}`;
    })();
  }
  dbUrl = await dbUrlPromise;
  return dbUrl;
}

export function setDatabasePath(path: string | null, options: { persist?: boolean; portable?: boolean } = {}) {
  if (shouldUseMockDatabase()) {
    return;
  }
  const { persist = true, portable = false } = options;
  portableMode = portable;
  const trimmed = path ? path.trim() : '';
  dbPath = trimmed.length ? trimmed : null;
  dbUrl = dbPath ? `sqlite:${dbPath}` : null;
  dbUrlPromise = null;
  if (typeof window !== 'undefined') {
    if (persist && dbPath) {
      window.localStorage.setItem(DB_PATH_STORAGE_KEY, dbPath);
    } else {
      window.localStorage.removeItem(DB_PATH_STORAGE_KEY);
    }
  }
  dbPromise = null;
  initPromise = null;
}

export interface MonthlySummary {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  benefitCents: number;
}

export interface MonthlySeriesPoint {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  benefitCents: number;
}

export interface MonthlySnapshotInput {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents?: number;
}

function shouldSeedDevData() {
  if (typeof window === 'undefined') {
    return false;
  }
  if (!import.meta.env.DEV) {
    return false;
  }
  return import.meta.env.VITE_SEED_MOCKS !== 'false';
}

function shouldResetDevMocks() {
  return shouldUseMockDatabase() || import.meta.env.VITE_SEED_MOCKS === 'force';
}

const MONTHLY_SUMMARY_SQL = `
SELECT
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents
FROM monthly_snapshots
WHERE month = ?;
`;

const MONTHLY_SERIES_SQL = `
SELECT
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents
FROM monthly_snapshots
ORDER BY month;
`;

const MONTHLY_WEALTH_SQL = `
SELECT balance_cents, portfolio_cents
FROM monthly_snapshots
WHERE month = ?;
`;

const LATEST_PORTFOLIO_BEFORE_MONTH_SQL = `
SELECT portfolio_cents
FROM monthly_snapshots
WHERE month < ? AND balance_cents <> 0
ORDER BY month DESC
LIMIT 1;
`;

const UPSERT_MONTH_SQL = `
INSERT INTO monthly_snapshots (
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents
)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(month) DO UPDATE SET
  income_cents = excluded.income_cents,
  expense_cents = excluded.expense_cents,
  balance_cents = excluded.balance_cents,
  portfolio_cents = excluded.portfolio_cents;
`;

const DELETE_MONTH_SQL = `
DELETE FROM monthly_snapshots
WHERE month = ?;
`;

const DELETE_YEAR_SQL = `
DELETE FROM monthly_snapshots
WHERE month LIKE ?;
`;

const DELETE_ALL_SQL = `
DELETE FROM monthly_snapshots;
`;

const GET_APP_SETTING_SQL = `
SELECT value
FROM app_settings
WHERE key = ?;
`;

const UPSERT_APP_SETTING_SQL = `
INSERT INTO app_settings (key, value)
VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value;
`;

const INVESTMENT_PORTFOLIO_SETTING_KEY = 'investmentPortfolioEnabled';

let dbPromise: Promise<Database> | null = null;
let initPromise: Promise<void> | null = null;
let devSeedPromise: Promise<void> | null = null;
let mockSnapshotsPromise: Promise<MonthlySnapshotInput[]> | null = null;

function snapshotPortfolioCents(snapshot: MonthlySnapshotInput) {
  return snapshot.portfolioCents ?? 0;
}

function summaryFromSnapshot(snapshot: MonthlySnapshotInput): MonthlySummary {
  const portfolioCents = snapshotPortfolioCents(snapshot);
  return {
    ...snapshot,
    portfolioCents,
    totalWealthCents: snapshot.balanceCents + portfolioCents,
    benefitCents: snapshot.incomeCents - snapshot.expenseCents
  };
}

function seriesFromSnapshot(snapshot: MonthlySnapshotInput): MonthlySeriesPoint {
  return summaryFromSnapshot(snapshot);
}

async function getMockSnapshots(): Promise<MonthlySnapshotInput[]> {
  if (!mockSnapshotsPromise) {
    mockSnapshotsPromise = (async () => {
      const { buildMockMonthlySnapshots } = await import('../mocks/monthlySnapshots');
      return buildMockMonthlySnapshots();
    })();
  }
  return mockSnapshotsPromise;
}

async function ensureDevSeeded(db: Database): Promise<void> {
  if (!import.meta.env.DEV || !shouldSeedDevData()) {
    return;
  }
  if (!devSeedPromise) {
    devSeedPromise = (async () => {
      if (shouldResetDevMocks()) {
        await db.execute(DELETE_ALL_SQL);
      }
      const rows = await db.select<Array<{ count: number }>>('SELECT COUNT(*) as count FROM monthly_snapshots;');
      const count = Number(rows[0]?.count ?? 0);
      if (Number.isFinite(count) && count > 0) {
        return;
      }
      const { buildMockMonthlySnapshots } = await import('../mocks/monthlySnapshots');
      const snapshots = buildMockMonthlySnapshots();
      for (const snapshot of snapshots) {
        await db.execute(UPSERT_MONTH_SQL, [
          snapshot.month,
          snapshot.incomeCents,
          snapshot.expenseCents,
          snapshot.balanceCents,
          snapshot.portfolioCents
        ]);
      }
    })();
  }
  await devSeedPromise;
}

async function ensureMonthlySnapshotColumns(db: Database): Promise<void> {
  const columns = await db.select<Array<{ name: string }>>('PRAGMA table_info(monthly_snapshots);');
  const existingColumns = new Set(columns.map((column) => column.name));
  if (!existingColumns.has('portfolio_cents')) {
    await db.execute(
      'ALTER TABLE monthly_snapshots ADD COLUMN portfolio_cents INTEGER NOT NULL DEFAULT 0 CHECK (portfolio_cents >= 0);'
    );
  }
}

async function ensureAppSettingsTable(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    const url = await resolveDatabaseUrl();
    dbPromise = Database.load(url);
  }
  return dbPromise;
}

async function initDb(): Promise<Database> {
  const db = await getDb();
  if (!initPromise) {
    initPromise = (async () => {
      await db.execute('PRAGMA foreign_keys = ON;');
      await db.execute(schemaSql);
      await ensureMonthlySnapshotColumns(db);
      await ensureAppSettingsTable(db);
      await ensureDevSeeded(db);
    })();
  }
  await initPromise;
  return db;
}

export async function getMonthlySummary(month: string): Promise<MonthlySummary | null> {
  if (shouldUseMockDatabase()) {
    const snapshots = await getMockSnapshots();
    const snapshot = snapshots.find((point) => point.month === month);
    return snapshot ? summaryFromSnapshot(snapshot) : null;
  }

  const db = await initDb();
  const rows = await db.select<Array<{
    month: string;
    income_cents: number;
    expense_cents: number;
    balance_cents: number;
    portfolio_cents?: number;
  }>>(MONTHLY_SUMMARY_SQL, [month]);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const incomeCents = row.income_cents ?? 0;
  const expenseCents = row.expense_cents ?? 0;
  const balanceCents = row.balance_cents ?? 0;
  const portfolioCents = row.portfolio_cents ?? 0;
  const benefitCents = incomeCents - expenseCents;

  return {
    month: row.month,
    incomeCents,
    expenseCents,
    balanceCents,
    portfolioCents,
    totalWealthCents: balanceCents + portfolioCents,
    benefitCents
  };
}

export async function getInvestmentPortfolioEnabled(): Promise<boolean> {
  if (shouldUseMockDatabase()) {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.localStorage.getItem(MOCK_INVESTMENT_PORTFOLIO_STORAGE_KEY) !== 'false';
  }

  const db = await initDb();
  const rows = await db.select<Array<{ value: string }>>(GET_APP_SETTING_SQL, [INVESTMENT_PORTFOLIO_SETTING_KEY]);
  const value = rows[0]?.value;
  if (value === 'false') {
    return false;
  }
  return true;
}

export async function setInvestmentPortfolioEnabled(enabled: boolean): Promise<void> {
  if (shouldUseMockDatabase()) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MOCK_INVESTMENT_PORTFOLIO_STORAGE_KEY, enabled ? 'true' : 'false');
    }
    return;
  }

  const db = await initDb();
  await db.execute(UPSERT_APP_SETTING_SQL, [
    INVESTMENT_PORTFOLIO_SETTING_KEY,
    enabled ? 'true' : 'false'
  ]);
}

export async function getMonthlySeries(): Promise<MonthlySeriesPoint[]> {
  if (shouldUseMockDatabase()) {
    const snapshots = await getMockSnapshots();
    return [...snapshots].sort((a, b) => a.month.localeCompare(b.month)).map(seriesFromSnapshot);
  }

  const db = await initDb();
  const rows = await db.select<Array<{
    month: string;
    income_cents: number;
    expense_cents: number;
    balance_cents: number;
    portfolio_cents?: number;
  }>>(MONTHLY_SERIES_SQL);

  return rows.map((row) => {
    const incomeCents = row.income_cents ?? 0;
    const expenseCents = row.expense_cents ?? 0;
    const balanceCents = row.balance_cents ?? 0;
    const portfolioCents = row.portfolio_cents ?? 0;
    return {
      month: row.month,
      incomeCents,
      expenseCents,
      balanceCents,
      portfolioCents,
      totalWealthCents: balanceCents + portfolioCents,
      benefitCents: incomeCents - expenseCents
    };
  });
}

export async function saveMonthlySnapshot(input: MonthlySnapshotInput): Promise<void> {
  if (shouldUseMockDatabase()) {
    const snapshots = await getMockSnapshots();
    const index = snapshots.findIndex((point) => point.month === input.month);
    const existingPortfolioCents =
      index >= 0 && snapshots[index].balanceCents !== 0 ? snapshotPortfolioCents(snapshots[index]) : undefined;
    const latestPreviousPortfolioCents = [...snapshots]
      .filter((point) => point.month < input.month && point.balanceCents !== 0)
      .sort((a, b) => b.month.localeCompare(a.month))[0]?.portfolioCents;
    const previousPortfolioCents =
      input.portfolioCents ?? existingPortfolioCents ?? latestPreviousPortfolioCents ?? 0;
    const nextInput = {
      ...input,
      portfolioCents: previousPortfolioCents
    };
    if (index >= 0) {
      snapshots[index] = nextInput;
    } else {
      snapshots.push(nextInput);
    }
    snapshots.sort((a, b) => a.month.localeCompare(b.month));
    return;
  }

  const db = await initDb();
  let portfolioCents = input.portfolioCents;
  if (portfolioCents === undefined) {
    const existingRows = await db.select<Array<{ balance_cents?: number; portfolio_cents?: number }>>(MONTHLY_WEALTH_SQL, [
      input.month
    ]);
    const existingRow = existingRows[0];
    portfolioCents = existingRow && existingRow.balance_cents !== 0 ? existingRow.portfolio_cents : undefined;
  }
  if (portfolioCents === undefined) {
    const previousRows = await db.select<Array<{ portfolio_cents?: number }>>(LATEST_PORTFOLIO_BEFORE_MONTH_SQL, [
      input.month
    ]);
    portfolioCents = previousRows[0]?.portfolio_cents ?? 0;
  }
  await db.execute(UPSERT_MONTH_SQL, [
    input.month,
    input.incomeCents,
    input.expenseCents,
    input.balanceCents,
    portfolioCents
  ]);
}

export async function deleteMonthlySnapshot(month: string): Promise<void> {
  if (shouldUseMockDatabase()) {
    const snapshots = await getMockSnapshots();
    const index = snapshots.findIndex((point) => point.month === month);
    if (index >= 0) {
      snapshots.splice(index, 1);
    }
    return;
  }

  const db = await initDb();
  await db.execute(DELETE_MONTH_SQL, [month]);
}

export async function deleteMonthlySnapshotsForYear(year: string): Promise<void> {
  if (shouldUseMockDatabase()) {
    const snapshots = await getMockSnapshots();
    const remaining = snapshots.filter((point) => !point.month.startsWith(`${year}-`));
    snapshots.splice(0, snapshots.length, ...remaining);
    return;
  }

  const db = await initDb();
  await db.execute(DELETE_YEAR_SQL, [`${year}-%`]);
}

export async function deleteAllMonthlySnapshots(): Promise<void> {
  if (shouldUseMockDatabase()) {
    const snapshots = await getMockSnapshots();
    snapshots.splice(0, snapshots.length);
    return;
  }

  const db = await initDb();
  await db.execute(DELETE_ALL_SQL);
}
