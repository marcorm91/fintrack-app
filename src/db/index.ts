import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import { formatMonthValue } from '../utils/date';
import schemaSql from './schema.sql?raw';

export const DATABASE_FILENAME = 'finanzas.db';
const DB_PATH_STORAGE_KEY = 'fintrack.dbPath';

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

let dbPath: string | null = loadStoredDatabasePath();
let dbUrl: string | null = dbPath ? `sqlite:${dbPath}` : null;
let dbUrlPromise: Promise<string> | null = null;
let portableMode = false;

export function getDatabasePath() {
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
  benefitCents: number;
}

export interface MonthlySeriesPoint {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  benefitCents: number;
}

export interface MonthlySnapshotInput {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
}

const DEV_SEED_MONTHS = 18;

function shouldSeedDevData() {
  if (typeof window === 'undefined') {
    return false;
  }
  if (!import.meta.env.DEV) {
    return false;
  }
  return import.meta.env.VITE_SEED_MOCKS !== 'false';
}

function buildMockSnapshots(): MonthlySnapshotInput[] {
  const now = new Date();
  const snapshots: MonthlySnapshotInput[] = [];
  let balanceCents = 780_000;

  for (let offset = DEV_SEED_MONTHS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const month = formatMonthValue(date.getFullYear(), date.getMonth() + 1);
    const incomeBase = 230_000 + (offset % 6) * 6_500;
    const expenseBase = 150_000 + (offset % 4) * 9_000;
    const incomeCents = Math.max(0, Math.round(incomeBase + Math.sin(offset / 2) * 12_000));
    const expenseCents = Math.max(0, Math.round(expenseBase + Math.cos(offset / 3) * 10_000));
    balanceCents += incomeCents - expenseCents;

    snapshots.push({
      month,
      incomeCents,
      expenseCents,
      balanceCents: Math.round(balanceCents)
    });
  }

  return snapshots;
}

const MONTHLY_SUMMARY_SQL = `
SELECT
  month,
  income_cents,
  expense_cents,
  balance_cents
FROM monthly_snapshots
WHERE month = ?;
`;

const MONTHLY_SERIES_SQL = `
SELECT
  month,
  income_cents,
  expense_cents,
  balance_cents
FROM monthly_snapshots
ORDER BY month;
`;

const UPSERT_MONTH_SQL = `
INSERT INTO monthly_snapshots (month, income_cents, expense_cents, balance_cents)
VALUES (?, ?, ?, ?)
ON CONFLICT(month) DO UPDATE SET
  income_cents = excluded.income_cents,
  expense_cents = excluded.expense_cents,
  balance_cents = excluded.balance_cents;
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

let dbPromise: Promise<Database> | null = null;
let initPromise: Promise<void> | null = null;
let devSeedPromise: Promise<void> | null = null;

async function ensureDevSeeded(db: Database): Promise<void> {
  if (!shouldSeedDevData()) {
    return;
  }
  if (!devSeedPromise) {
    devSeedPromise = (async () => {
      const rows = await db.select<{ count: number }>('SELECT COUNT(*) as count FROM monthly_snapshots;');
      const count = Number(rows[0]?.count ?? 0);
      if (Number.isFinite(count) && count > 0) {
        return;
      }
      const snapshots = buildMockSnapshots();
      for (const snapshot of snapshots) {
        await db.execute(UPSERT_MONTH_SQL, [
          snapshot.month,
          snapshot.incomeCents,
          snapshot.expenseCents,
          snapshot.balanceCents
        ]);
      }
    })();
  }
  await devSeedPromise;
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
      await ensureDevSeeded(db);
    })();
  }
  await initPromise;
  return db;
}

export async function getMonthlySummary(month: string): Promise<MonthlySummary | null> {
  const db = await initDb();
  const rows = await db.select<{
    month: string;
    income_cents: number;
    expense_cents: number;
    balance_cents: number;
  }>(MONTHLY_SUMMARY_SQL, [month]);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const incomeCents = row.income_cents ?? 0;
  const expenseCents = row.expense_cents ?? 0;
  const benefitCents = incomeCents - expenseCents;

  return {
    month: row.month,
    incomeCents,
    expenseCents,
    balanceCents: row.balance_cents ?? 0,
    benefitCents
  };
}

export async function getMonthlySeries(): Promise<MonthlySeriesPoint[]> {
  const db = await initDb();
  const rows = await db.select<{
    month: string;
    income_cents: number;
    expense_cents: number;
    balance_cents: number;
  }>(MONTHLY_SERIES_SQL);

  return rows.map((row) => {
    const incomeCents = row.income_cents ?? 0;
    const expenseCents = row.expense_cents ?? 0;
    return {
      month: row.month,
      incomeCents,
      expenseCents,
      balanceCents: row.balance_cents ?? 0,
      benefitCents: incomeCents - expenseCents
    };
  });
}

export async function saveMonthlySnapshot(input: MonthlySnapshotInput): Promise<void> {
  const db = await initDb();
  await db.execute(UPSERT_MONTH_SQL, [
    input.month,
    input.incomeCents,
    input.expenseCents,
    input.balanceCents
  ]);
}

export async function deleteMonthlySnapshot(month: string): Promise<void> {
  const db = await initDb();
  await db.execute(DELETE_MONTH_SQL, [month]);
}

export async function deleteMonthlySnapshotsForYear(year: string): Promise<void> {
  const db = await initDb();
  await db.execute(DELETE_YEAR_SQL, [`${year}-%`]);
}

export async function deleteAllMonthlySnapshots(): Promise<void> {
  const db = await initDb();
  await db.execute(DELETE_ALL_SQL);
}
