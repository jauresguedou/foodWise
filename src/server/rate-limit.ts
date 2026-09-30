import 'server-only';
import { countRecentSecurityEvents } from './security-events';

// spec.md: 5 failed sign-in attempts per email per 15 minutes.
// Code sending uses the same window so nobody can flood an inbox.
export const SIGN_IN_LIMITS = {
  windowMs: 15 * 60 * 1000,
  maxFailedCodes: 5,
  maxCodesSent: 5,
} as const;

// Counts are read, then acted on, so two requests racing at the limit can
// both get through. That is acceptable for a sign-in throttle.

export async function isCodeEntryBlocked(email: string): Promise<boolean> {
  const failures = await countRecentSecurityEvents(
    'SIGN_IN_FAILED',
    email,
    SIGN_IN_LIMITS.windowMs
  );
  return failures >= SIGN_IN_LIMITS.maxFailedCodes;
}

export async function isCodeSendingBlocked(email: string): Promise<boolean> {
  const sent = await countRecentSecurityEvents(
    'SIGN_IN_CODE_SENT',
    email,
    SIGN_IN_LIMITS.windowMs
  );
  return sent >= SIGN_IN_LIMITS.maxCodesSent;
}
