import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getSession,
  requireUser,
  requireVendor,
  requireVerifiedStudent,
  VERIFICATION_REQUIRED_PATH,
} from '@/src/auth/session';
import { db } from '@/src/db/client';
import { canUseStudentPrice } from '@/src/server/policies/student-pricing';
import { getMyProfile } from '@/src/server/queries/profile';
import { takeMemoryOutbox } from '@/src/server/email';
import {
  captureNavigation,
  createAccount,
  type Navigation,
  registerAndSignIn,
  signInExisting,
  signOutBrowser,
} from './helpers/auth';
import { resetDatabase } from './helpers/db';

vi.mock('next/headers', () => import('./helpers/next-headers'));

// Who is asking. Each persona signs in through the real code flow.
const personas = {
  anonymous: async () => {},
  unverifiedStudent: () => registerAndSignIn('pat@example.com'),
  verifiedStudent: () => registerAndSignIn('sam@byu.edu'),
  vendor: async () => {
    await createAccount('cafe@example.com', 'VENDOR');
    await signInExisting('cafe@example.com');
  },
  admin: async () => {
    await createAccount('admin@byu.edu', 'ADMIN');
    await signInExisting('admin@byu.edu');
  },
} as const;

type Persona = keyof typeof personas;

const allow: Navigation = { kind: 'none' };
const toLogin: Navigation = { kind: 'redirect', to: '/login' };
const toVerify: Navigation = {
  kind: 'redirect',
  to: VERIFICATION_REQUIRED_PATH,
};
const hidden: Navigation = { kind: 'notFound' };

// The matrix: what each persona gets from each protected entry point.
// Add a column here whenever a new protected action or query lands.
const matrix: Record<
  Persona,
  {
    requireUser: Navigation;
    requireVerifiedStudent: Navigation;
    requireVendor: Navigation;
    getMyProfile: Navigation;
    studentPrice: boolean;
  }
> = {
  anonymous: {
    requireUser: toLogin,
    requireVerifiedStudent: toLogin,
    requireVendor: toLogin,
    getMyProfile: toLogin,
    studentPrice: false,
  },
  unverifiedStudent: {
    requireUser: allow,
    requireVerifiedStudent: toVerify,
    requireVendor: hidden,
    getMyProfile: allow,
    studentPrice: false,
  },
  verifiedStudent: {
    requireUser: allow,
    requireVerifiedStudent: allow,
    requireVendor: hidden,
    getMyProfile: allow,
    studentPrice: true,
  },
  vendor: {
    requireUser: allow,
    requireVerifiedStudent: toVerify,
    requireVendor: allow,
    getMyProfile: allow,
    studentPrice: false,
  },
  // Admins get no shortcut past student or vendor checks.
  admin: {
    requireUser: allow,
    requireVerifiedStudent: toVerify,
    requireVendor: hidden,
    getMyProfile: allow,
    studentPrice: false,
  },
};

beforeEach(async () => {
  await resetDatabase();
  signOutBrowser();
  takeMemoryOutbox();
});

afterAll(async () => {
  await db.$disconnect();
});

describe.each(Object.keys(matrix) as Persona[])('as %s', (persona) => {
  const expected = matrix[persona];

  beforeEach(async () => {
    await personas[persona]();
  });

  it('requireUser', async () => {
    expect(await captureNavigation(requireUser)).toEqual(expected.requireUser);
  });

  it('requireVerifiedStudent', async () => {
    expect(await captureNavigation(requireVerifiedStudent)).toEqual(
      expected.requireVerifiedStudent
    );
  });

  it('requireVendor', async () => {
    expect(await captureNavigation(requireVendor)).toEqual(
      expected.requireVendor
    );
  });

  it('getMyProfile', async () => {
    expect(await captureNavigation(getMyProfile)).toEqual(
      expected.getMyProfile
    );
  });

  it('student prices', async () => {
    expect(canUseStudentPrice(await getSession())).toBe(expected.studentPrice);
  });
});

describe('record ownership', () => {
  it('returns only the signed-in user’s own profile', async () => {
    await registerAndSignIn('other@byu.edu');
    signOutBrowser();
    await registerAndSignIn('sam@byu.edu');

    const profile = await getMyProfile();

    expect(profile.email).toBe('sam@byu.edu');
    expect(Object.keys(profile)).not.toContain('consentVersion');
  });

  it('logs denied access without the email address', async () => {
    await registerAndSignIn('pat@example.com');

    await captureNavigation(requireVerifiedStudent);

    const denied = await db.securityEvent.findMany({
      where: { type: 'ACCESS_DENIED' },
    });
    expect(denied).toHaveLength(1);
    expect(denied[0].userId).not.toBeNull();
    expect(denied[0].emailHash).toBeNull();
  });
});
