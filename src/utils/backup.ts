import type { MonthlySeriesPoint, MonthlySnapshotInput } from '../db';

const BACKUP_FORMAT = 'fintrack-backup';
const BACKUP_FORMAT_VERSION = 1;
const MAX_BACKUP_SNAPSHOTS = 2400;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type BackupErrorKey =
  | 'settings.backupInvalidJson'
  | 'settings.backupInvalidFormat'
  | 'settings.backupUnsupportedVersion'
  | 'settings.backupInvalidData';

export class BackupParseError extends Error {
  readonly translationKey: BackupErrorKey;

  constructor(translationKey: BackupErrorKey) {
    super(translationKey);
    this.name = 'BackupParseError';
    this.translationKey = translationKey;
  }
}

export type FintrackBackup = {
  format: typeof BACKUP_FORMAT;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  appVersion: string;
  createdAt: string;
  settings: {
    investmentPortfolioEnabled: boolean;
  };
  snapshots: Array<{
    month: string;
    incomeCents: number;
    expenseCents: number;
    balanceCents: number;
    portfolioCents: number;
    portfolioContributionCents?: number | null;
    note: string;
  }>;
};

export type ParsedFintrackBackup = {
  appVersion: string;
  createdAt: string;
  investmentPortfolioEnabled: boolean;
  snapshots: MonthlySnapshotInput[];
};

export type BackupImportSummary = {
  newCount: number;
  changedCount: number;
  unchangedCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function invalidData(): never {
  throw new BackupParseError('settings.backupInvalidData');
}

export function buildJsonBackup(
  series: MonthlySeriesPoint[],
  investmentPortfolioEnabled: boolean,
  appVersion: string
) {
  const backup: FintrackBackup = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion,
    createdAt: new Date().toISOString(),
    settings: {
      investmentPortfolioEnabled
    },
    snapshots: series.map((point) => ({
      month: point.month,
      incomeCents: point.incomeCents,
      expenseCents: point.expenseCents,
      balanceCents: point.balanceCents,
      portfolioCents: point.portfolioCents,
      portfolioContributionCents: point.portfolioContributionCents,
      note: point.note
    }))
  };

  return `${JSON.stringify(backup, null, 2)}\n`;
}

function snapshotsMatch(left: MonthlySnapshotInput, right: MonthlySnapshotInput) {
  return (
    left.incomeCents === right.incomeCents &&
    left.expenseCents === right.expenseCents &&
    left.balanceCents === right.balanceCents &&
    (left.portfolioCents ?? 0) === (right.portfolioCents ?? 0) &&
    (left.portfolioContributionCents ?? null) === (right.portfolioContributionCents ?? null) &&
    (left.note ?? '') === (right.note ?? '')
  );
}

export function summarizeBackupImport(
  currentSeries: MonthlySeriesPoint[],
  backupSnapshots: MonthlySnapshotInput[]
): BackupImportSummary {
  const currentByMonth = new Map(currentSeries.map((snapshot) => [snapshot.month, snapshot]));
  return backupSnapshots.reduce<BackupImportSummary>(
    (summary, snapshot) => {
      const current = currentByMonth.get(snapshot.month);
      if (!current) {
        summary.newCount += 1;
      } else if (snapshotsMatch(current, snapshot)) {
        summary.unchangedCount += 1;
      } else {
        summary.changedCount += 1;
      }
      return summary;
    },
    { newCount: 0, changedCount: 0, unchangedCount: 0 }
  );
}

export function parseJsonBackup(text: string): ParsedFintrackBackup {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new BackupParseError('settings.backupInvalidJson');
  }

  if (!isRecord(value) || value.format !== BACKUP_FORMAT) {
    throw new BackupParseError('settings.backupInvalidFormat');
  }
  if (value.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new BackupParseError('settings.backupUnsupportedVersion');
  }
  if (
    typeof value.appVersion !== 'string' ||
    value.appVersion.length > 50 ||
    typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    !isRecord(value.settings) ||
    typeof value.settings.investmentPortfolioEnabled !== 'boolean' ||
    !Array.isArray(value.snapshots) ||
    value.snapshots.length > MAX_BACKUP_SNAPSHOTS
  ) {
    invalidData();
  }

  const months = new Set<string>();
  const snapshots = value.snapshots.map((snapshot) => {
    if (!isRecord(snapshot)) {
      return invalidData();
    }
    const { month, incomeCents, expenseCents, balanceCents, portfolioCents, portfolioContributionCents, note } = snapshot;
    if (
      typeof month !== 'string' ||
      !MONTH_PATTERN.test(month) ||
      months.has(month) ||
      !isSafeInteger(incomeCents) ||
      incomeCents < 0 ||
      !isSafeInteger(expenseCents) ||
      expenseCents < 0 ||
      !isSafeInteger(balanceCents) ||
      !isSafeInteger(portfolioCents) ||
      portfolioCents < 0 ||
      !(
        portfolioContributionCents === undefined ||
        portfolioContributionCents === null ||
        (isSafeInteger(portfolioContributionCents) && portfolioContributionCents >= 0)
      ) ||
      typeof note !== 'string' ||
      note.length > 500
    ) {
      return invalidData();
    }
    months.add(month);
    return {
      month,
      incomeCents,
      expenseCents,
      balanceCents,
      portfolioCents,
      portfolioContributionCents: portfolioContributionCents ?? null,
      note
    };
  });

  return {
    appVersion: value.appVersion,
    createdAt: value.createdAt,
    investmentPortfolioEnabled: value.settings.investmentPortfolioEnabled,
    snapshots
  };
}
