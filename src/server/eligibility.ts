import 'server-only';
import { getStudentEmailDomains, isStudentEmail } from '@/src/auth/eligibility';
import { db } from '@/src/db/client';
import { recordSecurityEvent } from './security-events';

// Runs after every new session. The student has just proven they own the
// address, so this is the moment a school email earns student prices.
export async function grantEligibilityIfQualified(
  userId: string
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      role: true,
      studentVerifiedAt: true,
    },
  });
  if (!user || user.role !== 'STUDENT' || user.studentVerifiedAt) return;
  if (!user.emailVerified) return;
  if (!isStudentEmail(user.email, getStudentEmailDomains())) return;

  // The null check makes a second, concurrent sign-in a no-op.
  const { count } = await db.user.updateMany({
    where: { id: userId, studentVerifiedAt: null },
    data: { studentVerifiedAt: new Date() },
  });
  if (count === 1) {
    await recordSecurityEvent('ELIGIBILITY_GRANTED', { userId });
  }
}
