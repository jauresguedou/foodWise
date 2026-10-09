'use server';

import { isAPIError } from 'better-auth/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/src/auth/auth';
import { CONSENT_VERSION } from '@/src/auth/consent';
import { getSession } from '@/src/auth/session';
import { db } from '@/src/db/client';
import { Prisma } from '@/src/generated/prisma/client';
import { safeCallbackUrl } from '@/src/lib/safe-redirect';
import {
  isCodeEntryBlocked,
  isCodeSendingBlocked,
} from '@/src/server/rate-limit';
import { recordSecurityEvent } from '@/src/server/security-events';
import {
  registerSchema,
  signInSchema,
  verifyCodeSchema,
} from '@/src/validation/auth';
import { type ActionResult, validationFailure } from './result';

export type CodeRequestResult = ActionResult<{
  email: string;
  accountType?: 'STUDENT' | 'VENDOR';
}>;

const TOO_MANY_CODES =
  'Too many codes requested for this email. Wait 15 minutes, then try again.';
const SEND_FAILED = "We couldn't send the email. Try again in a minute.";
const WRONG_CODE =
  'That code is wrong or has expired. Check your latest email, or request a new code.';
const TOO_MANY_ATTEMPTS =
  'Too many wrong codes. Wait 15 minutes, then request a new code.';

// Step 1 of registration. Replies the same way whether or not the email is
// already registered, so the form cannot be used to discover accounts.
export async function register(
  _previous: CodeRequestResult | null,
  formData: FormData
): Promise<CodeRequestResult> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const { name, email, countryCode,accountType } = parsed.data;

  if (await isCodeSendingBlocked(email)) {
    await recordSecurityEvent('SIGN_IN_RATE_LIMITED', { email });
    return { ok: false, message: TOO_MANY_CODES };
  }

  const profile = {
    name,
    countryCode,
    consentVersion: CONSENT_VERSION,
    consentedAt: new Date(),
    vendorApplicationRequestedAt:
        accountType === 'VENDOR' ? new Date() : null,
  };
  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!existing) {
    try {
      const user = await db.user.create({ data: { email, ...profile } });
      await recordSecurityEvent('REGISTERED', { userId: user.id });
    } catch (error) {
      // A concurrent registration for the same email won the race.
      if (!isUniqueViolation(error)) throw error;
    }
  } else if (!existing.emailVerified) {
    // Nobody has proven they own this address yet. Whoever enters the code
    // next owns the account, with the details and consent they just gave.
    await db.user.update({ where: { id: existing.id }, data: profile });
  }
  // A verified account is left unchanged; its owner just gets a sign-in code.

  return sendSignInCode(email, accountType);
}

// Sign-in step 1. Unknown emails get the same reply, and no email is sent.
export async function requestSignInCode(
  _previous: CodeRequestResult | null,
  formData: FormData
): Promise<CodeRequestResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const { email } = parsed.data;

  if (await isCodeSendingBlocked(email)) {
    await recordSecurityEvent('SIGN_IN_RATE_LIMITED', { email });
    return { ok: false, message: TOO_MANY_CODES };
  }
  return sendSignInCode(email);
}

// Step 2 of both flows. On success, sets the session cookie and redirects.
export async function verifySignInCode(
  _previous: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = verifyCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const { email, code, callbackUrl } = parsed.data;

  // Checked before the code, so a blocked email cannot keep guessing.
  if (await isCodeEntryBlocked(email)) {
    await recordSecurityEvent('SIGN_IN_RATE_LIMITED', { email });
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }

  try {
    const { user } = await auth.api.signInEmailOTP({
      body: { email, otp: code },
      headers: await headers(),
    });
    await recordSecurityEvent('SIGN_IN_SUCCEEDED', { userId: user.id });
  } catch (error) {
    if (!isAPIError(error)) throw error;
    await recordSecurityEvent('SIGN_IN_FAILED', { email });
    return {
      ok: false,
      message: WRONG_CODE,
      fieldErrors: { code: [WRONG_CODE] },
    };
  }


const verifiedUser = await db.user.findUnique({
  where: { email },
  select: {
    id: true,
    emailVerified: true,
    vendorApplicationRequestedAt: true,
  },
});

if (
  verifiedUser?.emailVerified &&
  verifiedUser.vendorApplicationRequestedAt
) {
  await db.$transaction(async (tx) => {
    await tx.vendorApplication.upsert({
      where: { userId: verifiedUser.id },
      create: { userId: verifiedUser.id },
      update: {},
    });

    await tx.user.update({
      where: { id: verifiedUser.id },
      data: { vendorApplicationRequestedAt: null },
    });
  });
}

  // Outside the try: redirect() works by throwing.
  redirect(safeCallbackUrl(callbackUrl));
}

export async function signOut(): Promise<void> {
  const user = await getSession();
  await auth.api.signOut({ headers: await headers() });
  if (user) await recordSecurityEvent('SIGNED_OUT', { userId: user.id });
  redirect('/');
}

async function sendSignInCode(
  email: string,
  accountType?: 'STUDENT' | 'VENDOR'): Promise<CodeRequestResult> {
  try {
    await auth.api.sendVerificationOTP({
      body: { email, type: 'sign-in' },
      headers: await headers(),
    });
  } catch (error) {
    console.error('Sending a sign-in code failed:', errorName(error));
    return { ok: false, message: SEND_FAILED };
  }
  return {
  ok: true,
  data: {
    email,
    ...(accountType ? { accountType } : {}),
  },
};
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

// Logs what failed without the message, which could include the address.
function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'Unknown error';
}
