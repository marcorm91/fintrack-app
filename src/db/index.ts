import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
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
