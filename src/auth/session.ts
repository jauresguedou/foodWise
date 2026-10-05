import 'server-only';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import type { Role } from '@/src/generated/prisma/enums';
import { recordSecurityEvent } from '@/src/server/security-events';
import { auth } from './auth';

// The only user data a page or action gets from the session.
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  countryCode: string;
  isVerifiedStudent: boolean;
};

export const VERIFICATION_REQUIRED_PATH = '/account?verification=required';

// Reads the session from the database on every request, so a role or
// eligibility change applies immediately.
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { user } = session;
  const role: Role = user.role ?? 'STUDENT';
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    countryCode: user.countryCode ?? 'US',
    isVerifiedStudent:
      role === 'STUDENT' &&
      user.emailVerified &&
      user.studentVerifiedAt != null,
  };
});

// These helpers are the security boundary. Call one at the top of every
// protected page, Server Action, and query, even when proxy.ts or a layout
// already redirected.

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  return user;
}

// Unverified students are sent to /account, which explains how to verify.
export async function requireVerifiedStudent(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isVerifiedStudent) {
    await recordSecurityEvent('ACCESS_DENIED', { userId: user.id });
    redirect(VERIFICATION_REQUIRED_PATH);
  }
  return user;
}

// Non-vendors get a 404, as if vendor pages did not exist.
export async function requireVendor(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'VENDOR') {
    await recordSecurityEvent('ACCESS_DENIED', { userId: user.id });
    notFound();
  }
  return user;
}
