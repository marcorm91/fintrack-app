import { describe, expect, it } from 'vitest';
import { formatInputCents, getBenefitClass, parseAmount } from './format';

describe('format utilities', () => {
  it('formats cents for form inputs', () => {
    expect(formatInputCents(123456)).toBe('1234.56');
    expect(formatInputCents(-987)).toBe('-9.87');
  });

  it('parses comma and dot decimal amounts', () => {
    expect(parseAmount('12,34')).toBe(12.34);
    expect(parseAmount('12.34')).toBe(12.34);
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBeNull();
  });

  it('selects benefit classes by sign', () => {
    expect(getBenefitClass(-1)).toBe('text-benefitNegative');
    expect(getBenefitClass(0)).toBe('text-benefit');
    expect(getBenefitClass(1)).toBe('text-benefit');
  });
});
