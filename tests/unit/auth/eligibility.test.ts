import { describe, expect, it } from 'vitest';
import {
  isStudentEmail,
  parseStudentEmailDomains,
} from '@/src/auth/eligibility';

describe('parseStudentEmailDomains', () => {
  it('splits, trims, lowercases, and drops empties and leading @', () => {
    expect(parseStudentEmailDomains(' BYU.edu, @byui.edu ,, ')).toEqual([
      'byu.edu',
      'byui.edu',
    ]);
  });

  it('allows no domains when the variable is missing', () => {
    expect(parseStudentEmailDomains(undefined)).toEqual([]);
  });
});

describe('isStudentEmail', () => {
  const domains = ['byu.edu'];

  it.each([
    ['sam@byu.edu', true],
    ['Sam@BYU.EDU', true],
    ['sam@mail.byu.edu', true],
    ['sam@byu.edu.example.com', false],
    ['sam@notbyu.edu', false],
    ['sam@example.com', false],
    ['byu.edu', false],
    ['@byu.edu', false],
  ])('%s → %s', (email, expected) => {
    expect(isStudentEmail(email, domains)).toBe(expected);
  });

  it('uses the part after the last @', () => {
    expect(isStudentEmail('"a@byu.edu"@example.com', domains)).toBe(false);
  });

  it('rejects everyone when no domains are configured', () => {
    expect(isStudentEmail('sam@byu.edu', [])).toBe(false);
  });
});
