import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import schemaSql from './schema.sql?raw';
import { notifyLocalDataChanged } from '../utils/localDataEvents';
import { isMobilePlatform } from '../utils/platform';

export const DATABASE_FILENAME = 'finanzas.db';
export const DATABASE_PATH_CHANGED_EVENT = 'fintrack:database-path-changed';
const MOCK_DATABASE_FILENAME = 'finanzas.mocks.db';
const DB_PATH_STORAGE_KEY = 'fintrack.dbPath';
const MOCK_INVESTMENT_PORTFOLIO_STORAGE_KEY = 'fintrack.mockInvestmentPortfolioEnabled';
const MOCK_OFFLINE_PIN_STORAGE_KEY = 'fintrack.mockOfflinePin';

function shouldUseMockDatabase() {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DB === 'true';
}

export function isUsingMockDatabase() {
  return shouldUseMockDatabase();
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

let dbPath: string | null = shouldUseMockDatabase() ? MOCK_DATABASE_FILENAME : null;
let dbUrl: string | null = dbPath ? `sqlite:${dbPath}` : null;
let portableMode = false;
let initialPathResolved = shouldUseMockDatabase();
let initialPathPromise: Promise<void> | null = null;

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

async function ensureInitialDatabasePath(): Promise<void> {
  if (initialPathResolved) {
    return;
  }
  if (!initialPathPromise) {
    initialPathPromise = (async () => {
      if (!isMobilePlatform()) {
        const portablePath = await resolvePortableDatabasePath();
        if (portablePath) {
          portableMode = true;
          dbPath = portablePath;
          dbUrl = `sqlite:${portablePath}`;
          initialPathResolved = true;
          return;
        }

        const storedPath = loadStoredDatabasePath();
        if (storedPath) {
          dbPath = storedPath;
          dbUrl = `sqlite:${storedPath}`;
        }
      }
      initialPathResolved = true;
    })().catch((error) => {
      initialPathPromise = null;
      throw error;
    });
  }
  await initialPathPromise;
}

export async function resolveDatabasePath(): Promise<string | null> {
  if (shouldUseMockDatabase()) {
    return MOCK_DATABASE_FILENAME;
  }
  await ensureInitialDatabasePath();
  return dbPath;
}

async function resolveDatabaseUrl(): Promise<string> {
  if (shouldUseMockDatabase()) {
    return `sqlite:${MOCK_DATABASE_FILENAME}`;
  }
  await ensureInitialDatabasePath();
  if (dbUrl) {
    return dbUrl;
  }
  dbUrl = `sqlite:${DATABASE_FILENAME}`;
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
  initialPathResolved = true;
  initialPathPromise = null;
  if (typeof window !== 'undefined') {
    if (persist && dbPath) {
      window.localStorage.setItem(DB_PATH_STORAGE_KEY, dbPath);
    } else {
      window.localStorage.removeItem(DB_PATH_STORAGE_KEY);
    }
  }
  dbPromise = null;
  initPromise = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DATABASE_PATH_CHANGED_EVENT));
  }
}

export interface MonthlySummary {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  benefitCents: number;
  note: string;
}

export interface MonthlySeriesPoint {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  totalWealthCents: number;
  benefitCents: number;
  note: string;
}

export interface MonthlySnapshotInput {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents?: number;
  note?: string;
}

export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface SyncableMonthlySnapshot {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  note: string;
  version: number;
  localRevision: number;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
}

export interface RemoteMonthlySnapshot {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  portfolioCents: number;
  note: string;
  version: number;
  updatedAt: string;
  deletedAt: string | null;
}

export type RemoteApplyResult = 'applied' | 'ignored' | 'local-pending' | 'conflict';

export interface MarkMonthlySnapshotSyncedInput {
  month: string;
  expectedVersion: number;
  expectedLocalRevision: number;
  nextVersion: number;
  remoteUpdatedAt: string;
  remoteDeletedAt: string | null;
}

export type MonthlySnapshotAcknowledgement = 'synced' | 'superseded' | 'stale';

function shouldSeedDevData() {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    import.meta.env.DEV &&
    shouldUseMockDatabase() &&
    import.meta.env.VITE_SEED_MOCKS !== 'false'
  );
}

function shouldResetDevMocks() {
  return shouldUseMockDatabase() && import.meta.env.VITE_SEED_MOCKS === 'force';
}

const MONTHLY_SUMMARY_SQL = `
SELECT
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents,
  note
FROM monthly_snapshots
WHERE month = ? AND deleted_at IS NULL;
`;

const MONTHLY_SERIES_SQL = `
SELECT
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents,
  note
FROM monthly_snapshots
WHERE deleted_at IS NULL
ORDER BY month;
`;

const MONTHLY_WEALTH_SQL = `
SELECT balance_cents, portfolio_cents, note
FROM monthly_snapshots
WHERE month = ?;
`;

const LATEST_PORTFOLIO_BEFORE_MONTH_SQL = `
SELECT portfolio_cents
FROM monthly_snapshots
WHERE month < ? AND balance_cents <> 0 AND deleted_at IS NULL
ORDER BY month DESC
LIMIT 1;
`;

const UPSERT_MONTH_SQL = `
INSERT INTO monthly_snapshots (
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents,
  note,
  version,
  local_revision,
  updated_at,
  deleted_at,
  sync_status
)
VALUES (?, ?, ?, ?, ?, ?, 0, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'pending')
ON CONFLICT(month) DO UPDATE SET
  income_cents = excluded.income_cents,
  expense_cents = excluded.expense_cents,
  balance_cents = excluded.balance_cents,
  portfolio_cents = excluded.portfolio_cents,
  note = excluded.note,
  local_revision = monthly_snapshots.local_revision + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  deleted_at = NULL,
  sync_status = 'pending';
`;

const DELETE_MONTH_SQL = `
UPDATE monthly_snapshots
SET
  local_revision = local_revision + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  sync_status = 'pending'
WHERE month = ? AND deleted_at IS NULL;
`;

const DELETE_YEAR_SQL = `
UPDATE monthly_snapshots
SET
  local_revision = local_revision + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  sync_status = 'pending'
WHERE month LIKE ? AND deleted_at IS NULL;
`;

const DELETE_ALL_SQL = `
UPDATE monthly_snapshots
SET
  local_revision = local_revision + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  sync_status = 'pending'
WHERE deleted_at IS NULL;
`;

const PURGE_ALL_SQL = `
DELETE FROM monthly_snapshots;
`;

const PENDING_MONTHLY_SNAPSHOTS_SQL = `
SELECT
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents,
  note,
  version,
  local_revision,
  updated_at,
  deleted_at,
  sync_status
FROM monthly_snapshots
WHERE sync_status = 'pending'
ORDER BY month;
`;

const CONFLICTED_MONTHLY_SNAPSHOTS_SQL = `
SELECT
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents,
  note,
  version,
  local_revision,
  updated_at,
  deleted_at,
  sync_status
FROM monthly_snapshots
WHERE sync_status = 'conflict'
ORDER BY month;
`;

const MONTHLY_SYNC_METADATA_SQL = `
SELECT version, local_revision, sync_status
FROM monthly_snapshots
WHERE month = ?;
`;

const MARK_MONTH_SYNCED_SQL = `
UPDATE monthly_snapshots
SET
  version = ?,
  updated_at = ?,
  deleted_at = ?,
  sync_status = 'synced'
WHERE
  month = ?
  AND version = ?
  AND local_revision = ?
  AND sync_status = 'pending';
`;

const MARK_MONTH_CONFLICT_SQL = `
UPDATE monthly_snapshots
SET sync_status = 'conflict'
WHERE
  month = ?
  AND version = ?
  AND local_revision = ?
  AND sync_status = 'pending';
`;

const ADVANCE_MONTH_VERSION_SQL = `
UPDATE monthly_snapshots
SET version = ?
WHERE
  month = ?
  AND version = ?
  AND local_revision > ?
  AND sync_status = 'pending';
`;

const APPLY_REMOTE_MONTH_SQL = `
INSERT INTO monthly_snapshots (
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents,
  note,
  version,
  local_revision,
  updated_at,
  deleted_at,
  sync_status
)
VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'synced')
ON CONFLICT(month) DO UPDATE SET
  income_cents = excluded.income_cents,
  expense_cents = excluded.expense_cents,
  balance_cents = excluded.balance_cents,
  portfolio_cents = excluded.portfolio_cents,
  note = excluded.note,
  version = excluded.version,
  updated_at = excluded.updated_at,
  deleted_at = excluded.deleted_at,
  sync_status = 'synced'
WHERE
  monthly_snapshots.sync_status = 'synced'
  AND monthly_snapshots.version < excluded.version;
`;

const FORCE_APPLY_REMOTE_MONTH_SQL = `
INSERT INTO monthly_snapshots (
  month,
  income_cents,
  expense_cents,
  balance_cents,
  portfolio_cents,
  note,
  version,
  local_revision,
  updated_at,
  deleted_at,
  sync_status
)
VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'synced')
ON CONFLICT(month) DO UPDATE SET
  income_cents = excluded.income_cents,
  expense_cents = excluded.expense_cents,
  balance_cents = excluded.balance_cents,
  portfolio_cents = excluded.portfolio_cents,
  note = excluded.note,
  version = excluded.version,
  local_revision = 0,
  updated_at = excluded.updated_at,
  deleted_at = excluded.deleted_at,
  sync_status = 'synced';
`;

const REBASE_CONFLICTED_MONTH_SQL = `
UPDATE monthly_snapshots
SET
  version = ?,
  local_revision = local_revision + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  sync_status = 'pending'
WHERE month = ? AND sync_status = 'conflict';
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

const DELETE_APP_SETTING_SQL = `
DELETE FROM app_settings
WHERE key = ?;
`;

const INVESTMENT_PORTFOLIO_SETTING_KEY = 'investmentPortfolioEnabled';
const OFFLINE_PIN_SETTING_KEY = 'offlinePin';
const DATABASE_ACCESS_SETTING_KEY = 'databaseAccess';
const DATABASE_ACCESS_LOCAL = 'local';
const DATABASE_ACCESS_CLOUD = 'cloud';
const DATABASE_ACCESS_CLOUD_PREFIX = 'cloud:';

export type DatabaseAccessPolicy =
  | { mode: 'local'; ownerUid: null }
  | { mode: 'cloud'; ownerUid: string | null };

export class DatabaseOwnerMismatchError extends Error {
  constructor() {
    super('La base de datos local está vinculada a otra cuenta cloud.');
    this.name = 'DatabaseOwnerMismatchError';
  }
}

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
    note: snapshot.note ?? '',
    portfolioCents,
    totalWealthCents: snapshot.balanceCents + portfolioCents,
    benefitCents: snapshot.incomeCents - snapshot.expenseCents
  };
}

function seriesFromSnapshot(snapshot: MonthlySnapshotInput): MonthlySeriesPoint {
  return summaryFromSnapshot(snapshot);
}

type SyncableMonthlySnapshotRow = {
  month: string;
  income_cents: number;
  expense_cents: number;
  balance_cents: number;
  portfolio_cents: number;
  note: string;
  version: number;
  local_revision: number;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
};

type MonthlySyncMetadataRow = {
  version: number;
  local_revision: number;
  sync_status: SyncStatus;
};

function syncableSnapshotFromRow(row: SyncableMonthlySnapshotRow): SyncableMonthlySnapshot {
  return {
    month: row.month,
    incomeCents: row.income_cents,
    expenseCents: row.expense_cents,
    balanceCents: row.balance_cents,
    portfolioCents: row.portfolio_cents,
    note: row.note,
    version: row.version,
    localRevision: row.local_revision,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status
  };
}

function normalizeSnapshotNote(note: string) {
  return note.replace(/\s+/g, ' ').trim().slice(0, 500);
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
        await db.execute(PURGE_ALL_SQL);
      }
      const rows = await db.select<Array<{ count: number }>>(
        'SELECT COUNT(*) as count FROM monthly_snapshots WHERE deleted_at IS NULL;'
      );
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
          snapshot.portfolioCents,
          snapshot.note ?? ''
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
  if (!existingColumns.has('note')) {
    await db.execute("ALTER TABLE monthly_snapshots ADD COLUMN note TEXT NOT NULL DEFAULT '';");
  }
  if (!existingColumns.has('version')) {
    await db.execute(
      'ALTER TABLE monthly_snapshots ADD COLUMN version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0);'
    );
  }
  if (!existingColumns.has('local_revision')) {
    await db.execute(
      'ALTER TABLE monthly_snapshots ADD COLUMN local_revision INTEGER NOT NULL DEFAULT 0 CHECK (local_revision >= 0);'
    );
  }
  if (!existingColumns.has('updated_at')) {
    await db.execute("ALTER TABLE monthly_snapshots ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';");
  }
  if (!existingColumns.has('deleted_at')) {
    await db.execute('ALTER TABLE monthly_snapshots ADD COLUMN deleted_at TEXT;');
  }
  if (!existingColumns.has('sync_status')) {
    await db.execute(
      "ALTER TABLE monthly_snapshots ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict'));"
    );
  }
  await db.execute(
    "UPDATE monthly_snapshots SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE updated_at = '';"
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_sync_status ON monthly_snapshots(sync_status);'
  );
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

function parseDatabaseAccessPolicy(value: string | undefined): DatabaseAccessPolicy | null {
  if (value === DATABASE_ACCESS_LOCAL) {
    return { mode: 'local', ownerUid: null };
  }
  if (value === DATABASE_ACCESS_CLOUD) {
    return { mode: 'cloud', ownerUid: null };
  }
  if (value?.startsWith(DATABASE_ACCESS_CLOUD_PREFIX)) {
    const ownerUid = value.slice(DATABASE_ACCESS_CLOUD_PREFIX.length).trim();
    if (ownerUid) {
      return { mode: 'cloud', ownerUid };
    }
  }
  return null;
}

async function readDatabaseAccessPolicy(db: Database): Promise<DatabaseAccessPolicy | null> {
  const rows = await db.select<Array<{ value: string }>>(GET_APP_SETTING_SQL, [
    DATABASE_ACCESS_SETTING_KEY
  ]);
  return parseDatabaseAccessPolicy(rows[0]?.value);
}

async function writeDatabaseAccessPolicy(db: Database, value: string): Promise<void> {
  await db.execute(UPSERT_APP_SETTING_SQL, [DATABASE_ACCESS_SETTING_KEY, value]);
}

export async function getDatabaseAccessPolicy(): Promise<DatabaseAccessPolicy> {
  if (shouldUseMockDatabase()) {
    return { mode: 'local', ownerUid: null };
  }
  const db = await initDb();
  const stored = await readDatabaseAccessPolicy(db);
  if (stored) {
    return stored;
  }

  const rows = await db.select<Array<{ count: number }>>(
    'SELECT COUNT(*) AS count FROM monthly_snapshots WHERE version > 0;'
  );
  const hasCloudHistory = Number(rows[0]?.count ?? 0) > 0;
  const inferred: DatabaseAccessPolicy = hasCloudHistory
    ? { mode: 'cloud', ownerUid: null }
    : { mode: 'local', ownerUid: null };
  await writeDatabaseAccessPolicy(
    db,
    hasCloudHistory ? DATABASE_ACCESS_CLOUD : DATABASE_ACCESS_LOCAL
  );
  return inferred;
}

export async function claimDatabaseForCloudUser(userId: string): Promise<DatabaseAccessPolicy> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('El identificador de la cuenta cloud no es válido.');
  }
  if (shouldUseMockDatabase()) {
    return { mode: 'cloud', ownerUid: normalizedUserId };
  }
  const db = await initDb();
  const current = (await readDatabaseAccessPolicy(db)) ?? (await getDatabaseAccessPolicy());
  if (current.ownerUid && current.ownerUid !== normalizedUserId) {
    throw new DatabaseOwnerMismatchError();
  }
  const claimed: DatabaseAccessPolicy = { mode: 'cloud', ownerUid: normalizedUserId };
  await writeDatabaseAccessPolicy(
    db,
    `${DATABASE_ACCESS_CLOUD_PREFIX}${normalizedUserId}`
  );
  return claimed;
}

export async function releaseDatabaseToLocal(userId: string): Promise<DatabaseAccessPolicy> {
  if (shouldUseMockDatabase()) {
    return { mode: 'local', ownerUid: null };
  }
  const db = await initDb();
  const current = (await readDatabaseAccessPolicy(db)) ?? (await getDatabaseAccessPolicy());
  if (current.ownerUid && current.ownerUid !== userId.trim()) {
    throw new DatabaseOwnerMismatchError();
  }
  await writeDatabaseAccessPolicy(db, DATABASE_ACCESS_LOCAL);
  return { mode: 'local', ownerUid: null };
}

export async function checkpointDatabase(): Promise<void> {
  if (shouldUseMockDatabase()) {
    return;
  }
  const db = await initDb();
  await db.execute('PRAGMA wal_checkpoint(FULL);');
}

export async function getOfflinePinRecord(): Promise<string | null> {
  if (shouldUseMockDatabase()) {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(MOCK_OFFLINE_PIN_STORAGE_KEY);
  }
  const db = await initDb();
  const rows = await db.select<Array<{ value: string }>>(GET_APP_SETTING_SQL, [
    OFFLINE_PIN_SETTING_KEY
  ]);
  return rows[0]?.value ?? null;
}

export async function setOfflinePinRecord(value: string): Promise<void> {
  if (shouldUseMockDatabase()) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MOCK_OFFLINE_PIN_STORAGE_KEY, value);
    }
    return;
  }
  const db = await initDb();
  await db.execute(UPSERT_APP_SETTING_SQL, [OFFLINE_PIN_SETTING_KEY, value]);
}

export async function clearOfflinePinRecord(): Promise<void> {
  if (shouldUseMockDatabase()) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(MOCK_OFFLINE_PIN_STORAGE_KEY);
    }
    return;
  }
  const db = await initDb();
  await db.execute(DELETE_APP_SETTING_SQL, [OFFLINE_PIN_SETTING_KEY]);
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
    note?: string;
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
    benefitCents,
    note: row.note ?? ''
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
    note?: string;
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
      benefitCents: incomeCents - expenseCents,
      note: row.note ?? ''
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
      portfolioCents: previousPortfolioCents,
      note: input.note ?? (index >= 0 ? snapshots[index].note : '') ?? ''
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
  let note = input.note;
  if (portfolioCents === undefined || note === undefined) {
    const existingRows = await db.select<Array<{ balance_cents?: number; portfolio_cents?: number; note?: string }>>(MONTHLY_WEALTH_SQL, [
      input.month
    ]);
    const existingRow = existingRows[0];
    if (portfolioCents === undefined) {
      portfolioCents = existingRow && existingRow.balance_cents !== 0 ? existingRow.portfolio_cents : undefined;
    }
    note = note ?? existingRow?.note ?? '';
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
    portfolioCents,
    normalizeSnapshotNote(note)
  ]);
  notifyLocalDataChanged();
}

async function getMonthlySnapshotsForSync(query: string): Promise<SyncableMonthlySnapshot[]> {
  if (shouldUseMockDatabase()) {
    return [];
  }
  const db = await initDb();
  const rows = await db.select<SyncableMonthlySnapshotRow[]>(query);
  return rows.map(syncableSnapshotFromRow);
}

export async function getPendingMonthlySnapshots(): Promise<SyncableMonthlySnapshot[]> {
  return getMonthlySnapshotsForSync(PENDING_MONTHLY_SNAPSHOTS_SQL);
}

export async function getConflictedMonthlySnapshots(): Promise<SyncableMonthlySnapshot[]> {
  return getMonthlySnapshotsForSync(CONFLICTED_MONTHLY_SNAPSHOTS_SQL);
}

export async function markMonthlySnapshotSynced(input: MarkMonthlySnapshotSyncedInput): Promise<boolean> {
  if (input.nextVersion <= input.expectedVersion) {
    throw new Error('La versión remota debe ser posterior a la versión local confirmada.');
  }
  if (shouldUseMockDatabase()) {
    return false;
  }
  const db = await initDb();
  const result = await db.execute(MARK_MONTH_SYNCED_SQL, [
    input.nextVersion,
    input.remoteUpdatedAt,
    input.remoteDeletedAt,
    input.month,
    input.expectedVersion,
    input.expectedLocalRevision
  ]);
  return result.rowsAffected > 0;
}

export async function acknowledgeMonthlySnapshotSync(
  input: MarkMonthlySnapshotSyncedInput
): Promise<MonthlySnapshotAcknowledgement> {
  const synced = await markMonthlySnapshotSynced(input);
  if (synced) {
    return 'synced';
  }
  if (shouldUseMockDatabase()) {
    return 'stale';
  }
  const db = await initDb();
  const advanced = await db.execute(ADVANCE_MONTH_VERSION_SQL, [
    input.nextVersion,
    input.month,
    input.expectedVersion,
    input.expectedLocalRevision
  ]);
  return advanced.rowsAffected > 0 ? 'superseded' : 'stale';
}

export async function markMonthlySnapshotConflict(
  month: string,
  expectedVersion: number,
  expectedLocalRevision: number
): Promise<boolean> {
  if (shouldUseMockDatabase()) {
    return false;
  }
  const db = await initDb();
  const result = await db.execute(MARK_MONTH_CONFLICT_SQL, [month, expectedVersion, expectedLocalRevision]);
  return result.rowsAffected > 0;
}

async function getMonthlySyncMetadata(db: Database, month: string): Promise<MonthlySyncMetadataRow | null> {
  const rows = await db.select<MonthlySyncMetadataRow[]>(MONTHLY_SYNC_METADATA_SQL, [month]);
  return rows[0] ?? null;
}

async function markRemoteConflictIfStillPending(
  db: Database,
  month: string,
  metadata: MonthlySyncMetadataRow
): Promise<RemoteApplyResult> {
  const result = await db.execute(MARK_MONTH_CONFLICT_SQL, [
    month,
    metadata.version,
    metadata.local_revision
  ]);
  if (result.rowsAffected > 0) {
    return 'conflict';
  }
  const latest = await getMonthlySyncMetadata(db, month);
  return latest?.sync_status === 'conflict' ? 'conflict' : 'local-pending';
}

export async function applyRemoteMonthlySnapshot(input: RemoteMonthlySnapshot): Promise<RemoteApplyResult> {
  if (shouldUseMockDatabase()) {
    return 'ignored';
  }
  const db = await initDb();
  const current = await getMonthlySyncMetadata(db, input.month);

  if (current?.sync_status === 'conflict') {
    return 'conflict';
  }
  if (current?.sync_status === 'pending') {
    if (input.version > current.version) {
      return markRemoteConflictIfStillPending(db, input.month, current);
    }
    return 'local-pending';
  }
  if (current && input.version <= current.version) {
    return 'ignored';
  }

  const result = await db.execute(APPLY_REMOTE_MONTH_SQL, [
    input.month,
    input.incomeCents,
    input.expenseCents,
    input.balanceCents,
    input.portfolioCents,
    normalizeSnapshotNote(input.note),
    input.version,
    input.updatedAt,
    input.deletedAt
  ]);
  if (result.rowsAffected > 0) {
    return 'applied';
  }

  const latest = await getMonthlySyncMetadata(db, input.month);
  if (latest?.sync_status === 'conflict') {
    return 'conflict';
  }
  if (latest?.sync_status === 'pending') {
    if (input.version > latest.version) {
      return markRemoteConflictIfStillPending(db, input.month, latest);
    }
    return 'local-pending';
  }
  return 'ignored';
}

export async function forceApplyRemoteMonthlySnapshot(input: RemoteMonthlySnapshot): Promise<void> {
  if (shouldUseMockDatabase()) {
    return;
  }
  const db = await initDb();
  await db.execute(FORCE_APPLY_REMOTE_MONTH_SQL, [
    input.month,
    input.incomeCents,
    input.expenseCents,
    input.balanceCents,
    input.portfolioCents,
    normalizeSnapshotNote(input.note),
    input.version,
    input.updatedAt,
    input.deletedAt
  ]);
}

export async function rebaseConflictedMonthlySnapshot(month: string, remoteVersion: number): Promise<boolean> {
  if (!Number.isSafeInteger(remoteVersion) || remoteVersion < 0) {
    throw new Error('La versión remota no es válida.');
  }
  if (shouldUseMockDatabase()) {
    return false;
  }
  const db = await initDb();
  const result = await db.execute(REBASE_CONFLICTED_MONTH_SQL, [remoteVersion, month]);
  return result.rowsAffected > 0;
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
  notifyLocalDataChanged();
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
  notifyLocalDataChanged();
}

export async function deleteAllMonthlySnapshots(): Promise<void> {
  if (shouldUseMockDatabase()) {
    const snapshots = await getMockSnapshots();
    snapshots.splice(0, snapshots.length);
    return;
  }

  const db = await initDb();
  await db.execute(DELETE_ALL_SQL);
  notifyLocalDataChanged();
}
