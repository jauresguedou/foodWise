import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession } from '@/src/auth/session';
import { CONSENT_VERSION } from '@/src/auth/consent';
import { db } from '@/src/db/client';
import {
  register,
  requestSignInCode,
  signOut,
  verifySignInCode,
} from '@/src/server/actions/auth';
import { takeMemoryOutbox } from '@/src/server/email';
import { SIGN_IN_LIMITS } from '@/src/server/rate-limit';
import {
  captureNavigation,
  createAccount,
  form,
  newStudent,
  readLatestCode,
  registerAndSignIn,
} from './helpers/auth';
import { resetDatabase } from './helpers/db';
import { browser } from './helpers/next-headers';

vi.mock('next/headers', () => import('./helpers/next-headers'));

const SCHOOL_EMAIL = 'sam@byu.edu';
const OTHER_EMAIL = 'sam@example.com';

async function eventTypes() {
  const events = await db.securityEvent.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return events.map((event) => event.type);
}

beforeEach(async () => {
  await resetDatabase();
  browser.clearCookies();
  takeMemoryOutbox();
});

afterAll(async () => {
  await db.$disconnect();
});

describe('registration', () => {
  it('requires consent and creates nothing without it', async () => {
    const result = await register(
      null,
      form({ name: 'Sam', email: SCHOOL_EMAIL, countryCode: 'US' })
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors?.consent).toBeTruthy();
    expect(await db.user.count()).toBe(0);
    expect(takeMemoryOutbox()).toHaveLength(0);
  });

  it('reports every invalid field', async () => {
    const result = await register(
      null,
      form({ name: ' ', email: 'not-an-email', countryCode: 'USA' })
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual([
      'consent',
      'countryCode',
      'email',
      'name',
    ]);
  });

  it('records consent, lowercases the email, and sends a code', async () => {
    const result = await register(
      null,
      form({ ...newStudent, email: '  Sam@BYU.edu ' })
    );

    expect(result).toEqual({ ok: true, data: { email: SCHOOL_EMAIL } });
    const user = await db.user.findUniqueOrThrow({
      where: { email: SCHOOL_EMAIL },
    });
    expect(user.consentVersion).toBe(CONSENT_VERSION);
    expect(user.consentedAt).toBeInstanceOf(Date);
    expect(user.emailVerified).toBe(false);
    expect(user.studentVerifiedAt).toBeNull();
    expect(readLatestCode(SCHOOL_EMAIL)).toMatch(/^\d{6}$/);
    expect(await eventTypes()).toEqual(['REGISTERED', 'SIGN_IN_CODE_SENT']);
  });

  it('gives the same answer for an address that already has an account', async () => {
    await registerAndSignIn(SCHOOL_EMAIL);
    browser.clearCookies();

    const result = await register(
      null,
      form({ ...newStudent, name: 'Someone Else', email: SCHOOL_EMAIL })
    );

    expect(result).toEqual({ ok: true, data: { email: SCHOOL_EMAIL } });
    // The verified owner's details are not overwritten.
    const user = await db.user.findUniqueOrThrow({
      where: { email: SCHOOL_EMAIL },
    });
    expect(user.name).toBe(newStudent.name);
  });
});

describe('signing in with a code', () => {
  it('verifies a school email and starts a secure session', async () => {
    await registerAndSignIn(SCHOOL_EMAIL);

    const session = await getSession();
    expect(session).toMatchObject({
      email: SCHOOL_EMAIL,
      role: 'STUDENT',
      isVerifiedStudent: true,
    });

    const [cookieName] = browser.cookieNames();
    expect(cookieName).toContain('session_token');
    expect(browser.cookieOptions(cookieName)).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
    });
    expect(await eventTypes()).toContain('ELIGIBILITY_GRANTED');
  });

  it('signs in a non-school email without student eligibility', async () => {
    await registerAndSignIn(OTHER_EMAIL);

    const session = await getSession();
    expect(session?.email).toBe(OTHER_EMAIL);
    expect(session?.isVerifiedStudent).toBe(false);
    expect(await eventTypes()).not.toContain('ELIGIBILITY_GRANTED');
  });

  it('never makes a vendor a verified student, even on a school domain', async () => {
    await createAccount('cafe@byu.edu', 'VENDOR');
    await requestSignInCode(null, form({ email: 'cafe@byu.edu' }));
    await captureNavigation(() =>
      verifySignInCode(
        null,
        form({ email: 'cafe@byu.edu', code: readLatestCode('cafe@byu.edu') })
      )
    );

    const session = await getSession();
    expect(session?.role).toBe('VENDOR');
    expect(session?.isVerifiedStudent).toBe(false);
  });

  it('rejects a wrong code without creating a session', async () => {
    await register(null, form({ ...newStudent, email: SCHOOL_EMAIL }));

    const result = await verifySignInCode(
      null,
      form({ email: SCHOOL_EMAIL, code: '000000' })
    );

    expect(result.ok).toBe(false);
    expect(await getSession()).toBeNull();
    expect(await eventTypes()).toContain('SIGN_IN_FAILED');
  });

  it('follows a same-site callback URL and ignores an off-site one', async () => {
    await register(null, form({ ...newStudent, email: SCHOOL_EMAIL }));
    const code = readLatestCode(SCHOOL_EMAIL);

    const offSite = await captureNavigation(() =>
      verifySignInCode(
        null,
        form({ email: SCHOOL_EMAIL, code, callbackUrl: '//evil.example' })
      )
    );

    expect(offSite).toEqual({ kind: 'redirect', to: '/account' });
  });

  it('does not email or create anything for an unknown address', async () => {
    const result = await requestSignInCode(
      null,
      form({ email: 'nobody@byu.edu' })
    );

    expect(result).toEqual({ ok: true, data: { email: 'nobody@byu.edu' } });
    expect(takeMemoryOutbox()).toHaveLength(0);
    expect(await db.user.count()).toBe(0);
  });

  it('signs out and ends the session', async () => {
    await registerAndSignIn(SCHOOL_EMAIL);

    const navigation = await captureNavigation(() => signOut());

    expect(navigation).toEqual({ kind: 'redirect', to: '/' });
    expect(await getSession()).toBeNull();
    expect(await db.session.count()).toBe(0);
  });
});

describe('rate limits', () => {
  it(`blocks code entry after ${SIGN_IN_LIMITS.maxFailedCodes} failures, even with the right code`, async () => {
    await register(null, form({ ...newStudent, email: OTHER_EMAIL }));
    // Better Auth voids a code after 3 wrong tries; our counter keeps going.
    for (let attempt = 0; attempt < SIGN_IN_LIMITS.maxFailedCodes; attempt++) {
      await verifySignInCode(
        null,
        form({ email: OTHER_EMAIL, code: '000000' })
      );
    }
    takeMemoryOutbox();
    await requestSignInCode(null, form({ email: OTHER_EMAIL }));
    const rightCode = readLatestCode(OTHER_EMAIL);

    const result = await verifySignInCode(
      null,
      form({ email: OTHER_EMAIL, code: rightCode })
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toMatch(/Too many wrong codes/);
    expect(await getSession()).toBeNull();
    expect(await eventTypes()).toContain('SIGN_IN_RATE_LIMITED');
  });

  it(`stops sending codes after ${SIGN_IN_LIMITS.maxCodesSent} in the window`, async () => {
    await register(null, form({ ...newStudent, email: OTHER_EMAIL }));
    for (let sent = 1; sent < SIGN_IN_LIMITS.maxCodesSent; sent++) {
      await requestSignInCode(null, form({ email: OTHER_EMAIL }));
    }
    takeMemoryOutbox();

    const result = await requestSignInCode(null, form({ email: OTHER_EMAIL }));

    expect(result.ok).toBe(false);
    expect(takeMemoryOutbox()).toHaveLength(0);
  });

  it('counts limits per email, so one address cannot lock out another', async () => {
    await register(null, form({ ...newStudent, email: OTHER_EMAIL }));
    for (let attempt = 0; attempt < SIGN_IN_LIMITS.maxFailedCodes; attempt++) {
      await verifySignInCode(
        null,
        form({ email: OTHER_EMAIL, code: '000000' })
      );
    }

    await registerAndSignIn(SCHOOL_EMAIL);

    expect((await getSession())?.email).toBe(SCHOOL_EMAIL);
  });
});

describe('security events', () => {
  it('never store an email address, a code, or eligibility details', async () => {
    await register(null, form({ ...newStudent, email: SCHOOL_EMAIL }));
    const code = readLatestCode(SCHOOL_EMAIL);
    await verifySignInCode(null, form({ email: SCHOOL_EMAIL, code: '000000' }));
    await captureNavigation(() =>
      verifySignInCode(null, form({ email: SCHOOL_EMAIL, code }))
    );

    const stored = JSON.stringify(await db.securityEvent.findMany());

    expect(stored).not.toContain(SCHOOL_EMAIL);
    expect(stored).not.toContain('byu.edu');
    expect(stored).not.toContain(code);
  });

  it('store sign-in codes hashed, never as typed', async () => {
    await register(null, form({ ...newStudent, email: SCHOOL_EMAIL }));
    const code = readLatestCode(SCHOOL_EMAIL);

    const stored = JSON.stringify(await db.verification.findMany());

    expect(stored).not.toContain(code);
  });
});
