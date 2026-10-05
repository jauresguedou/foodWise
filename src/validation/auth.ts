import { z } from 'zod';
import { isCountryCode } from '@/src/lib/countries';

const emailSchema = z
  .string({ error: 'Enter your email address.' })
  .trim()
  .toLowerCase()
  .max(254, { error: 'That email address is too long.' })
  .pipe(z.email({ error: 'Enter a valid email address.' }));

export const registerSchema = z.object({
  name: z
    .string({ error: 'Enter your name.' })
    .trim()
    .min(1, { error: 'Enter your name.' })
    .max(100, { error: 'Use 100 characters or fewer.' }),
  email: emailSchema,
  countryCode: z
    .string({ error: 'Choose your country.' })
    .trim()
    .toUpperCase()
    .refine(isCountryCode, { error: 'Choose your country.' }),
  // An unchecked checkbox is missing from the form data entirely.
  consent: z.literal('on', {
    error: 'You need to agree to this before we can create your account.',
  }),
});

export const signInSchema = z.object({
  email: emailSchema,
});

export const verifyCodeSchema = z.object({
  email: emailSchema,
  code: z
    .string({ error: 'Enter the 6-digit code from your email.' })
    .trim()
    .regex(/^\d{6}$/, { error: 'Enter the 6-digit code from your email.' }),
  callbackUrl: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
