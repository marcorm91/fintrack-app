export function getMonthValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getYearValue(date: Date) {
  return String(date.getFullYear());
}

export function getMonthParts(value: string) {
  const [yearText, monthText] = value.split('-');
  return {
    year: Number(yearText),
    month: Number(monthText)
  };
}

export function formatMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function shiftMonthValue(value: string, delta: number) {
  const { year, month } = getMonthParts(value);
  const date = new Date(year, month - 1 + delta, 1);
  return formatMonthValue(date.getFullYear(), date.getMonth() + 1);
}

export function shiftYearValue(value: string, delta: number) {
  const year = Number(value);
  if (!Number.isFinite(year)) {
    return value;
  }
  return String(year + delta);
}

const DEFAULT_LOCALE = 'es';

export function getMonthLabel(monthValue: string, locale: string = DEFAULT_LOCALE) {
  const { year, month } = getMonthParts(monthValue);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return monthValue;
  }
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
  return label.replace('.', '').toLowerCase();
}

export function getMonthLabels(locale: string = DEFAULT_LOCALE) {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: 12 }, (_, index) =>
    formatter.format(new Date(2024, index, 1)).replace('.', '').toLowerCase()
  );
}
