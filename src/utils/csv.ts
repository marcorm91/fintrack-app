import type { MonthlySnapshotInput } from '../db';
import i18n from '../i18n';
import { formatMonthValue } from './date';

const MONTH_NAME_MAP: Record<string, number> = {
  ene: 1,
  enero: 1,
  jan: 1,
  january: 1,
  feb: 2,
  febrero: 2,
  february: 2,
  mar: 3,
  marzo: 3,
  march: 3,
  abr: 4,
  abril: 4,
  apr: 4,
  april: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  june: 6,
  jul: 7,
  julio: 7,
  july: 7,
  ago: 8,
  agosto: 8,
  aug: 8,
  august: 8,
  sep: 9,
  septiembre: 9,
  setiembre: 9,
  sept: 9,
  september: 9,
  oct: 10,
  octubre: 10,
  october: 10,
  nov: 11,
  noviembre: 11,
  november: 11,
  dic: 12,
  diciembre: 12,
  dec: 12,
  december: 12
};

const IMPORT_HEADER_ALIASES = {
  month: ['month', 'mes', 'fecha'],
  year: ['year', 'ano'],
  income: ['income', 'ingresos'],
  expense: ['expense', 'gastos'],
  balance: ['balance', 'saldo', 'acumulacion', 'saldo al cierre', 'saldo cierre']
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.some((alias) => header === alias || header.includes(alias)));
}

function parseLooseNumber(value: string) {
  const cleaned = value.replace(/[^0-9,.-]/g, '').trim();
  if (!cleaned) return null;
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;
  if (hasComma && hasDot) {
    normalized =
      cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

function parseYearValue(value: string | undefined) {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length !== 4) return null;
  const year = Number(digits);
  return Number.isFinite(year) ? year : null;
}

function parseMonthValue(rawMonth: string, rawYear?: string) {
  const normalized = normalizeHeader(rawMonth);
  if (!normalized) return null;
  const yearValue = parseYearValue(rawYear);
  let match = normalized.match(/^(\d{4})[-/](\d{1,2})/);
  if (match) {
    return formatMonthValue(Number(match[1]), Number(match[2]));
  }
  match = normalized.match(/^(\d{1,2})[-/](\d{4})/);
  if (match) {
    return formatMonthValue(Number(match[2]), Number(match[1]));
  }
  match = normalized.match(/^([a-z]+)\s+(\d{4})$/);
  if (match && MONTH_NAME_MAP[match[1]]) {
    return formatMonthValue(Number(match[2]), MONTH_NAME_MAP[match[1]]);
  }
  if (MONTH_NAME_MAP[normalized] && yearValue) {
    return formatMonthValue(yearValue, MONTH_NAME_MAP[normalized]);
  }
  if (/^\d{1,2}$/.test(normalized) && yearValue) {
    return formatMonthValue(yearValue, Number(normalized));
  }
  return null;
}

export function parseCsvSnapshots(text: string): MonthlySnapshotInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!lines.length) {
    throw new Error(i18n.t('errors.emptyFile'));
  }

  const delimiter = lines.some((line) => line.includes(';')) ? ';' : ',';
  const rows = lines.map((line) =>
    line
      .split(delimiter)
      .map((cell) => cell.trim().replace(/^"|"$/g, ''))
  );

  const header = rows[0].map(normalizeHeader);
  const hasHeader = header.some((cell) =>
    Object.values(IMPORT_HEADER_ALIASES).some((aliases) => aliases.some((alias) => cell.includes(alias)))
  );

  let startIndex = 0;
  let monthIndex = 0;
  let incomeIndex = 1;
  let expenseIndex = 2;
  let balanceIndex = 3;
  let yearIndex = -1;

  if (hasHeader) {
    startIndex = 1;
    monthIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.month);
    yearIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.year);
    incomeIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.income);
    expenseIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.expense);
    balanceIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.balance);
    if (monthIndex < 0 || incomeIndex < 0 || expenseIndex < 0 || balanceIndex < 0) {
      throw new Error(i18n.t('errors.missingColumns'));
    }
  }

  const snapshots: MonthlySnapshotInput[] = [];
  for (let i = startIndex; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.every((cell) => cell.trim() === '')) {
      continue;
    }
    const monthValue = parseMonthValue(row[monthIndex] ?? '', row[yearIndex] ?? '');
    if (!monthValue) {
      throw new Error(i18n.t('errors.invalidMonthLine', { line: i + 1 }));
    }
    const income = parseLooseNumber(row[incomeIndex] ?? '');
    const expense = parseLooseNumber(row[expenseIndex] ?? '');
    const balance = parseLooseNumber(row[balanceIndex] ?? '');
    if (income === null || expense === null || balance === null) {
      throw new Error(i18n.t('errors.invalidValuesLine', { line: i + 1 }));
    }
    snapshots.push({
      month: monthValue,
      incomeCents: Math.round(income * 100),
      expenseCents: Math.round(expense * 100),
      balanceCents: Math.round(balance * 100)
    });
  }

  if (!snapshots.length) {
    throw new Error(i18n.t('errors.noRowsImport'));
  }

  return snapshots;
}

export function parseMonthCsv(text: string, month: string): MonthlySnapshotInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!lines.length) {
    throw new Error(i18n.t('errors.emptyFile'));
  }

  const delimiter = lines.some((line) => line.includes(';')) ? ';' : ',';
  const rows = lines.map((line) =>
    line
      .split(delimiter)
      .map((cell) => cell.trim().replace(/^"|"$/g, ''))
  );

  const header = rows[0].map(normalizeHeader);
  const hasHeader = header.some((cell) =>
    Object.values(IMPORT_HEADER_ALIASES).some((aliases) => aliases.some((alias) => cell.includes(alias)))
  );

  let startIndex = 0;
  let monthIndex = -1;
  let incomeIndex = 0;
  let expenseIndex = 1;
  let balanceIndex = 2;
  let yearIndex = -1;

  if (hasHeader) {
    startIndex = 1;
    monthIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.month);
    yearIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.year);
    incomeIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.income);
    expenseIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.expense);
    balanceIndex = findHeaderIndex(header, IMPORT_HEADER_ALIASES.balance);
    if (incomeIndex < 0 || expenseIndex < 0 || balanceIndex < 0) {
      throw new Error(i18n.t('errors.missingColumnsMonth'));
    }
  }

  const rowsToParse = rows.slice(startIndex).filter((row) => row.some((cell) => cell.trim() !== ''));
  if (!rowsToParse.length) {
    throw new Error(i18n.t('errors.noRowsImport'));
  }

  if (monthIndex < 0 && rowsToParse.length > 1) {
    throw new Error(i18n.t('errors.monthImportSingleRow'));
  }

  const snapshots: MonthlySnapshotInput[] = [];
  for (let i = 0; i < rowsToParse.length; i += 1) {
    const row = rowsToParse[i];
    const rowMonth = monthIndex >= 0 ? parseMonthValue(row[monthIndex] ?? '', row[yearIndex] ?? '') : month;
    if (!rowMonth) {
      throw new Error(i18n.t('errors.invalidMonthLine', { line: startIndex + i + 1 }));
    }
    if (rowMonth !== month) {
      throw new Error(i18n.t('errors.monthImportMismatch'));
    }
    const income = parseLooseNumber(row[incomeIndex] ?? '');
    const expense = parseLooseNumber(row[expenseIndex] ?? '');
    const balance = parseLooseNumber(row[balanceIndex] ?? '');
    if (income === null || expense === null || balance === null) {
      throw new Error(i18n.t('errors.invalidValuesLine', { line: startIndex + i + 1 }));
    }
    snapshots.push({
      month,
      incomeCents: Math.round(income * 100),
      expenseCents: Math.round(expense * 100),
      balanceCents: Math.round(balance * 100)
    });
  }

  if (snapshots.length !== 1) {
    throw new Error(i18n.t('errors.monthImportSingleRowRequired'));
  }

  return snapshots;
}
