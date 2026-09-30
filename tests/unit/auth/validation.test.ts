import { describe, expect, it } from 'vitest';
import {
  registerSchema,
  signInSchema,
  verifyCodeSchema,
} from '@/src/validation/auth';

const validRegistration = {
  name: '  Sam Student ',
  email: ' Sam@BYU.edu ',
  countryCode: 'us',
  consent: 'on',
};

describe('registerSchema', () => {
  it('normalizes name, email, and country', () => {
    expect(registerSchema.parse(validRegistration)).toEqual({
      name: 'Sam Student',
      email: 'sam@byu.edu',
      countryCode: 'US',
      consent: 'on',
    });
  });

  it('requires the consent checkbox', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      consent: undefined,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['consent']);
  });

  it.each(['', 'USA', 'U1'])('rejects country code %j', (countryCode) => {
    expect(
      registerSchema.safeParse({ ...validRegistration, countryCode }).success
    ).toBe(false);
  });

  it('rejects a name over 100 characters', () => {
    expect(
      registerSchema.safeParse({ ...validRegistration, name: 'a'.repeat(101) })
        .success
    ).toBe(false);
  });
});

describe('signInSchema', () => {
  it.each(['', 'sam', 'sam@', 'sam@byu'])('rejects %j', (email) => {
    expect(signInSchema.safeParse({ email }).success).toBe(false);
  });
});

describe('verifyCodeSchema', () => {
  it('accepts a 6-digit code with stray spaces', () => {
    expect(
      verifyCodeSchema.parse({ email: 'sam@byu.edu', code: ' 123456 ' }).code
    ).toBe('123456');
  });

  it.each(['12345', '1234567', 'abcdef', '12 345'])('rejects %j', (code) => {
    expect(
      verifyCodeSchema.safeParse({ email: 'sam@byu.edu', code }).success
    ).toBe(false);
  });
});
