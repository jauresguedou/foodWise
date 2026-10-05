import { describe, expect, it } from 'vitest';
import { getCountryOptions, isCountryCode } from '@/src/lib/countries';

describe('countries', () => {
  it('lists all 249 ISO 3166-1 countries once, with names', () => {
    const options = getCountryOptions();

    expect(options).toHaveLength(249);
    expect(new Set(options.map(({ code }) => code)).size).toBe(249);
    expect(options.every(({ code }) => /^[A-Z]{2}$/.test(code))).toBe(true);
    expect(options.find(({ code }) => code === 'GH')?.name).toBe('Ghana');
  });

  it('sorts by name', () => {
    const names = getCountryOptions().map(({ name }) => name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  it.each([
    ['US', true],
    ['PH', true],
    ['XX', false],
    ['us', false],
  ])('isCountryCode(%j) → %s', (code, expected) => {
    expect(isCountryCode(code)).toBe(expected);
  });
});
