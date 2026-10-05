import 'server-only';
import { requireUser } from '@/src/auth/session';
import { db } from '@/src/db/client';

// The signed-in user's own profile. The id comes from the session, never
// from a parameter, so there is no way to ask for someone else's.
export async function getMyProfile() {
  const user = await requireUser();
  return db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      countryCode: true,
      studentVerifiedAt: true,
      createdAt: true,
    },
  });
}
