import 'server-only';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { Role } from '@/src/generated/prisma/enums';
import { recordSecurityEvent } from '@/src/server/security-events';
import { auth } from './auth';
import { db } from '@/src/db/client';
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  countryCode: string;
  isVerifiedStudent: boolean;
};

export const VERIFICATION_REQUIRED_PATH = '/account?verification=required';

export async function getSession(): Promise<SessionUser | null> {
  console.log('[AUTH DEBUG] getSession() START');

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log(
    '[AUTH DEBUG] getSession() RESULT:',
    session
      ? {
          sessionId: session.session.id,
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role,
          emailVerified: session.user.emailVerified,
          studentVerifiedAt: session.user.studentVerifiedAt,
        }
      : 'NO SESSION'
  );

  if (!session) {
    console.log('[AUTH DEBUG] getSession() RETURNING NULL');
    return null;
  }

  const { user } = session;
  const role: Role = user.role ?? 'STUDENT';

  const result: SessionUser = {
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

  console.log('[AUTH DEBUG] getSession() RETURNING USER:', {
    id: result.id,
    role: result.role,
    isVerifiedStudent: result.isVerifiedStudent,
  });

  return result;
}

export async function requireUser(): Promise<SessionUser> {
  console.log('[AUTH DEBUG] requireUser() START');

  const user = await getSession();

  console.log(
    '[AUTH DEBUG] requireUser() AFTER getSession:',
    user
      ? {
          id: user.id,
          role: user.role,
          isVerifiedStudent: user.isVerifiedStudent,
        }
      : 'NULL'
  );

  if (!user) {
    console.log('[AUTH DEBUG] requireUser() REDIRECTING TO /login');
    redirect('/login');
  }

  console.log('[AUTH DEBUG] requireUser() RETURNING USER');

  return user;
}


export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  // Check the user's current role directly in the database.
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    await recordSecurityEvent('ACCESS_DENIED', { userId: user.id });
    notFound();
  }

  return {
    ...user,
    role: dbUser.role,
  };
}

export async function requireVerifiedStudent(): Promise<SessionUser> {
  const user = await requireUser();

  if (!user.isVerifiedStudent) {
    await recordSecurityEvent('ACCESS_DENIED', { userId: user.id });
    redirect(VERIFICATION_REQUIRED_PATH);
  }

  return user;
}

export async function requireVendor(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== 'VENDOR') {
    await recordSecurityEvent('ACCESS_DENIED', { userId: user.id });
    notFound();
  }

  return user;
}
