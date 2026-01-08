const EURO_FORMATTER = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatEuro(value: number) {
  return EURO_FORMATTER.format(value);
}

export function formatCents(cents: number) {
  return EURO_FORMATTER.format(cents / 100);
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
