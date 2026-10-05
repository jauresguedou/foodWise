import 'server-only';
import { createHmac } from 'node:crypto';
import { db } from '@/src/db/client';
import type { SecurityEventType } from '@/src/generated/prisma/enums';

// A keyed hash, so events can be counted per email without storing the
// address. Without the key, the hash cannot be reversed by guessing emails.
export function hashEmail(email: string): string {
  const key = process.env.BETTER_AUTH_SECRET;
  if (!key) {
    throw new Error('BETTER_AUTH_SECRET is not set. See .env.example.');
  }
  return createHmac('sha256', key)
    .update(`security-event:${email.trim().toLowerCase()}`)
    .digest('hex');
}

type Subject = { userId?: string; email?: string };

// Never pass codes, tokens, or eligibility details here.
export async function recordSecurityEvent(
  type: SecurityEventType,
  subject: Subject
): Promise<void> {
  await db.securityEvent.create({
    data: {
      type,
      userId: subject.userId ?? null,
      emailHash: subject.email ? hashEmail(subject.email) : null,
    },
  });
}

export async function countRecentSecurityEvents(
  type: SecurityEventType,
  email: string,
  windowMs: number
): Promise<number> {
  return db.securityEvent.count({
    where: {
      type,
      emailHash: hashEmail(email),
      createdAt: { gte: new Date(Date.now() - windowMs) },
    },
  });
}
