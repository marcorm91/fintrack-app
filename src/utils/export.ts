import type { MonthlySeriesPoint } from '../db';
import schemaSql from '../db/schema.sql?raw';

const CSV_HEADERS = {
  es: ['mes', 'ingresos', 'gastos', 'saldo al cierre'],
  en: ['month', 'income', 'expenses', 'closing balance']
};

function resolveCsvHeaders(locale: string) {
  return locale.startsWith('es') ? CSV_HEADERS.es : CSV_HEADERS.en;
}

function formatCsvNumber(cents: number, locale: string) {
  const value = (cents / 100).toFixed(2);
  return locale.startsWith('es') ? value.replace('.', ',') : value;
}

export function buildCsvSnapshots(series: MonthlySeriesPoint[], locale: string) {
  const lines = [resolveCsvHeaders(locale).join(';')];
  for (const point of series) {
    lines.push(
      [
        point.month,
        formatCsvNumber(point.incomeCents, locale),
        formatCsvNumber(point.expenseCents, locale),
        formatCsvNumber(point.balanceCents, locale)
      ].join(';')
    );
  }
  return lines.join('\n');
}

function escapeSqlValue(value: string) {
  return value.replace(/'/g, "''");
}

export function buildSqlDump(series: MonthlySeriesPoint[]) {
  const lines: string[] = [];
  const trimmedSchema = schemaSql.trim();
  if (trimmedSchema) {
    lines.push(trimmedSchema);
  }
  if (series.length > 0) {
    lines.push('BEGIN TRANSACTION;');
    for (const point of series) {
      lines.push(
        `INSERT INTO monthly_snapshots (month, income_cents, expense_cents, balance_cents) VALUES ('${escapeSqlValue(
          point.month
        )}', ${point.incomeCents}, ${point.expenseCents}, ${point.balanceCents});`
      );
    }
    lines.push('COMMIT;');
  }
  return lines.join('\n');
}
