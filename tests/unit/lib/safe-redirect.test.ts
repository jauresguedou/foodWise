import { describe, expect, it } from 'vitest';
import { safeCallbackUrl } from '@/src/lib/safe-redirect';

describe('safeCallbackUrl', () => {
  it.each([
    ['/cart', '/cart'],
    ['/meals?campus=provo', '/meals?campus=provo'],
    [undefined, '/account'],
    ['', '/account'],
    ['https://evil.example', '/account'],
    ['//evil.example', '/account'],
    ['/\\evil.example', '/account'],
    ['javascript:alert(1)', '/account'],
  ])('%j → %j', (input, expected) => {
    expect(safeCallbackUrl(input)).toBe(expected);
  });
});
