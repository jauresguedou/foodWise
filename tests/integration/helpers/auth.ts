import { expect } from 'vitest';
import { db } from '@/src/db/client';
import type { Role } from '@/src/generated/prisma/enums';
import {
  register,
  requestSignInCode,
  verifySignInCode,
} from '@/src/server/actions/auth';
import { takeMemoryOutbox } from '@/src/server/email';
import { browser } from './next-headers';

export function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

// The code from the newest email to this address, as the student would read it.
export function readLatestCode(email: string): string {
  const message = takeMemoryOutbox()
    .filter((sent) => sent.to === email)
    .at(-1);
  const code = message?.text.match(/\b(\d{6})\b/)?.[1];
  if (!code) throw new Error(`No sign-in code was emailed to ${email}`);
  return code;
}

export type Navigation =
  { kind: 'redirect'; to: string } | { kind: 'notFound' } | { kind: 'none' };

// Next's redirect() and notFound() work by throwing an error with a digest.
export async function captureNavigation(
  run: () => Promise<unknown>
): Promise<Navigation> {
  try {
    await run();
    return { kind: 'none' };
  } catch (error) {
    const digest =
      error instanceof Error && 'digest' in error ? String(error.digest) : '';
    if (digest.startsWith('NEXT_REDIRECT;')) {
      return { kind: 'redirect', to: digest.split(';')[2] };
    }
    if (digest === 'NEXT_HTTP_ERROR_FALLBACK;404') return { kind: 'notFound' };
    throw error;
  }
}

export const newStudent = {
  name: 'Sam Student',
  countryCode: 'US',
  consent: 'on',
};

export async function registerAndSignIn(email: string): Promise<void> {
  const result = await register(null, form({ ...newStudent, email }));
  expect(result.ok).toBe(true);
  await enterCode(email, readLatestCode(email));
}

// For accounts that already exist, such as seeded vendors.
export async function signInExisting(email: string): Promise<void> {
  const result = await requestSignInCode(null, form({ email }));
  expect(result.ok).toBe(true);
  await enterCode(email, readLatestCode(email));
}

async function enterCode(email: string, code: string): Promise<void> {
  const navigation = await captureNavigation(() =>
    verifySignInCode(null, form({ email, code }))
  );
  expect(navigation).toEqual({ kind: 'redirect', to: '/account' });
}

export async function createAccount(email: string, role: Role) {
  return db.user.create({ data: { email, name: `${role} user`, role } });
}

export function signOutBrowser(): void {
  browser.clearCookies();
}
