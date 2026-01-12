const EURO_FORMATTER = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true
});
const EURO_FORMATTER_INT = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  useGrouping: true
});

export function formatEuro(value: number) {
  const rounded = Math.round(value * 100);
  return rounded % 100 === 0 ? EURO_FORMATTER_INT.format(value) : EURO_FORMATTER.format(value);
}

export function formatCents(cents: number) {
  const abs = Math.abs(cents);
  return abs % 100 === 0 ? EURO_FORMATTER_INT.format(cents / 100) : EURO_FORMATTER.format(cents / 100);
}

export function formatInputCents(cents: number) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${(abs / 100).toFixed(2)}`;
}

export function getBenefitClass(valueCents: number) {
  return valueCents < 0 ? 'text-benefitNegative' : 'text-benefit';
}

export function parseAmount(value: string) {
  const normalized = value.replace(',', '.').trim();
  if (normalized === '') return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return amount;
}
