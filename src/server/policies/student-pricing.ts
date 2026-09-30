import type { SessionUser } from '@/src/auth/session';

// Student prices apply only to a signed-in, verified student. Cart and
// checkout (#20) call this with the server session, never with a client flag.
export function canUseStudentPrice(user: SessionUser | null): boolean {
  return user?.isVerifiedStudent === true;
}
