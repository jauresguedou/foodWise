import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { emailOTP } from 'better-auth/plugins';
import { db } from '@/src/db/client';
import { grantEligibilityIfQualified } from '@/src/server/eligibility';
import { sendEmail } from '@/src/server/email';
import { recordSecurityEvent } from '@/src/server/security-events';

export const SIGN_IN_CODE_TTL_SECONDS = 5 * 60;

// Vercel gives every preview deployment its own URL in VERCEL_URL, so only
// production and local development need BETTER_AUTH_URL.
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

// Passwordless sign-in: FoodWise emails a 6-digit code and stores no passwords.
//
// There is deliberately no /api/auth route. Only our Server Actions in
// src/server/actions/auth.ts call Better Auth, so every sign-in passes our
// validation, consent, and rate limits. Reads BETTER_AUTH_SECRET from the
// environment.
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  baseURL,
  user: {
    additionalFields: {
      // input: false means Better Auth never accepts these from a request.
      role: {
        type: ['STUDENT', 'VENDOR', 'ADMIN'],
        input: false,
        required: false,
        defaultValue: 'STUDENT',
      },
      studentVerifiedAt: { type: 'date', input: false, required: false },
      countryCode: {
        type: 'string',
        input: false,
        required: false,
        defaultValue: 'US',
      },
    },
  },
  advanced: {
    // Let Postgres assign cuid ids, as in the rest of the schema.
    database: { generateId: false },
    // Data minimization: sessions do not record IP addresses.
    ipAddress: { disableIpTracking: true },
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await grantEligibilityIfQualified(session.userId);
        },
      },
    },
  },
  plugins: [
    emailOTP({
      // Accounts are created only by the register action, after consent.
      disableSignUp: true,
      otpLength: 6,
      expiresIn: SIGN_IN_CODE_TTL_SECONDS,
      allowedAttempts: 3,
      storeOTP: 'hashed',
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== 'sign-in') return;
        await sendEmail({
          to: email,
          subject: 'Your FoodWise sign-in code',
          text: [
            `Your FoodWise sign-in code is ${otp}.`,
            `It expires in ${SIGN_IN_CODE_TTL_SECONDS / 60} minutes.`,
            '',
            "If you didn't ask for this code, you can ignore this email.",
          ].join('\n'),
        });
        await recordSecurityEvent('SIGN_IN_CODE_SENT', { email });
      },
    }),
    // Must stay last: it copies Better Auth's cookies onto the Next response.
    nextCookies(),
  ],
});
